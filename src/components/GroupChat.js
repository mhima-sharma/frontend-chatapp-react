import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { IoSend } from "react-icons/io5";
import { FiPaperclip, FiMoreVertical } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import { MdVideoCall, MdCall } from "react-icons/md";

const SOCKET_SERVER_URL = "http://localhost:3000";
const API_SERVER_URL = "http://localhost:3000/api";

const GroupChat = () => {
  const [searchParams] = useSearchParams();
  const groupName = searchParams.get("groupName");
  const groupId = searchParams.get("groupId");

  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser?.id;

  useEffect(() => {
    const fetchGroupMessages = async () => {
        
      try {
         const token = localStorage.getItem("token");
        const res = await axios.get(`${API_SERVER_URL}/chat/group/messages/${groupId}`,
           {
          headers: { Authorization: `Bearer ${token}` }
           }
        )
        ;
        
      } catch (err) {
        console.error("Failed to load group messages:", err);
      }
    };
    fetchGroupMessages();
  }, [groupId]);

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);
    socketRef.current.emit("join-group", { groupId, userId: currentUserId });

    socketRef.current.on("group-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socketRef.current.disconnect();
  }, [groupId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text, type = "text", file_url = null) => {
    if (!text.trim() && type === "text") return;
    const msg = {
      sender: currentUserId,
      groupId,
      message: text,
      type,
      file_url,
    };
    socketRef.current.emit("group-message", msg);
    setMessages((prev) => [...prev, msg]);
    if (type === "text") setInput("");
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${API_SERVER_URL}/auth/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      sendMessage(res.data.fileUrl, "file", res.data.fileUrl);
    } catch (err) {
      console.error("File upload failed", err);
    }
  };

  const onEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between bg-gray-800 px-6 py-4 shadow-md fixed top-0 left-0 right-0 z-30">
        <h2 className="text-xl font-semibold truncate max-w-xs md:max-w-md">{groupName || "Group Chat"}</h2>
        <div className="flex gap-5 text-gray-300 text-2xl">
          <button title="Video Call" className="hover:text-blue-400"><MdVideoCall /></button>
          <button title="Call" className="hover:text-blue-400"><MdCall /></button>
          <button title="More" className="hover:text-blue-400"><FiMoreVertical /></button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-6 pt-20 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900" style={{ paddingBottom: "120px" }}>
        {messages.length === 0 && (
          <p className="text-center text-gray-400 mt-10">No messages yet. Be the first!</p>
        )}

        {messages.map((msg, index) => {
          const isCurrentUser = msg.sender === currentUserId;

          // ✅ CHANGED: Avoid duplicate key warning by using a more unique key instead of just `index`
          const uniqueKey = `${msg.sender}-${msg.message}-${index}`;

          return (
            <div
              key={uniqueKey}
              className={`max-w-xs md:max-w-lg px-6 py-4 rounded-2xl text-base relative break-words shadow-lg ${
                isCurrentUser ? "bg-blue-600 ml-auto text-right" : "bg-green-600 mr-auto text-left"
              }`}
            >
              {!isCurrentUser && <div className="text-xs font-semibold text-gray-300 mb-1">{msg.senderName || "Member"}</div>}
              {msg.type === "file" ? (
                /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(msg.message) ? (
                  <img src={msg.message} alt="file" className="rounded-lg max-w-full max-h-[280px] object-cover" />
                ) : (
                  <a href={msg.message} target="_blank" rel="noopener noreferrer" className="underline text-sm">📄 Download File</a>
                )
              ) : (
                <span>{msg.message}</span>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 p-4 flex items-center gap-3 fixed bottom-0 left-0 right-0 border-t border-gray-700 z-30">
        <button
          onClick={() => setShowPicker((val) => !val)}
          className="text-3xl hover:text-yellow-400"
          title="Emoji"
        >
          <BsEmojiSmile />
        </button>

        {showPicker && (
          <div className="absolute bottom-16 left-4 z-50 md:right-4 md:left-auto md:bottom-20">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}

        <button
          onClick={() => fileInputRef.current.click()}
          className="text-3xl hover:text-green-400"
          title="Attach File"
        >
          <FiPaperclip />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage(input);
          }}
          className="flex-1 p-3 rounded-2xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
        />

        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim()}
          className={`bg-blue-600 hover:bg-blue-700 p-3 rounded-full text-white text-2xl transition duration-300 ${
            !input.trim() && "opacity-50 cursor-not-allowed"
          }`}
        >
          <IoSend />
        </button>
      </footer>
    </div>
  );
};

export default GroupChat;
