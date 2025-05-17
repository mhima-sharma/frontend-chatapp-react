import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { IoSend } from "react-icons/io5";
import { FiPaperclip } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import { MdVideoCall, MdCall } from "react-icons/md";
import { FiMoreVertical } from "react-icons/fi";

const SOCKET_SERVER_URL = "http://localhost:3000";
const API_SERVER_URL = "http://localhost:3000/api";

const UserChat = () => {
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const [searchParams] = useSearchParams();
  const receiverUserId = searchParams.get("receiverId");
  const receiverUserName = searchParams.get("receiverName");

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser?.id;

  const roomId =
    Number(currentUserId) < Number(receiverUserId)
      ? `${currentUserId}_${receiverUserId}`
      : `${receiverUserId}_${currentUserId}`;

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${API_SERVER_URL}/auth/messages/${roomId}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };
    fetchMessages();
  }, [roomId]);

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);
    socketRef.current.emit("join-room", { userId: currentUserId, roomId });

    socketRef.current.on("private-message", ({ fromUserId, message, type, file_url }) => {
      if (fromUserId !== currentUserId) {
        setMessages((prev) => [...prev, { sender: fromUserId, text: message, type, file_url }]);
      }
    });

    return () => socketRef.current.disconnect();
  }, [roomId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text, type = "text", file_url = null) => {
    if (!text.trim() && type === "text") return;
    const msg = { fromUserId: currentUserId, toUserId: receiverUserId, roomId, message: text, type, file_url };
    socketRef.current.emit("private-message", msg);
    setMessages((prev) => [...prev, { sender: currentUserId, text, type, file_url }]);
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
    } catch (error) {
      console.error("File upload failed", error);
    }
  };

  const onEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between bg-gray-800 px-6 py-4 shadow-md fixed top-0 left-0 right-0 z-30">
        <h2 className="text-xl font-semibold truncate max-w-xs md:max-w-md">{receiverUserName || "Chat"}</h2>
        <div className="flex gap-5 text-gray-300 text-2xl">
          <button
            title="Video Call"
            className="hover:text-blue-400 transition-colors duration-300 focus:outline-none"
          >
            <MdVideoCall />
          </button>
          <button
            title="Call"
            className="hover:text-blue-400 transition-colors duration-300 focus:outline-none"
          >
            <MdCall />
          </button>
          <button
            title="More Options"
            className="hover:text-blue-400 transition-colors duration-300 focus:outline-none"
          >
            <FiMoreVertical />
          </button>
        </div>
      </header>

      {/* Messages */}
      <main
        className="flex-1 overflow-y-auto p-6 pt-20 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
        style={{ paddingBottom: "120px" }}
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 && (
          <p className="text-center text-gray-400 mt-10 select-none">No messages yet. Start the conversation!</p>
        )}

        {messages.map((msg, index) => {
          const isCurrentUser = msg.sender === currentUserId;
          return (
            <div
              key={index}
              className={`max-w-xs md:max-w-lg px-6 py-4 rounded-2xl text-base relative break-words shadow-lg
              ${
                isCurrentUser
                  ? "bg-blue-600 ml-auto text-right"
                  : "bg-green-600 mr-auto text-left"
              }`}
            >
              {msg.type === "file" ? (
                /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(msg.text) ? (
                  <img
                    src={msg.text}
                    alt="sent"
                    className="rounded-lg max-w-full max-h-[280px] object-cover"
                    loading="lazy"
                  />
                ) : (
                  <a
                    href={msg.text}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-sm inline-flex items-center gap-2"
                  >
                    📄 Download File
                  </a>
                )
              ) : (
                <span>{msg.text}</span>
              )}
              {/* Optional timestamp here */}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Section */}
      <footer className="bg-gray-800 p-4 flex items-center gap-3 fixed bottom-0 left-0 right-0 border-t border-gray-700 z-30">
        <button
          onClick={() => setShowPicker((val) => !val)}
          className="text-3xl hover:text-yellow-400 transition-colors duration-300 focus:outline-none"
          title="Emoji Picker"
          aria-label="Toggle emoji picker"
        >
          <BsEmojiSmile />
        </button>

        {showPicker && (
          <div className="absolute bottom-16 left-4 z-50 shadow-lg rounded-lg overflow-hidden md:left-auto md:right-4 md:bottom-20">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}

        <button
          onClick={() => fileInputRef.current.click()}
          className="text-3xl hover:text-green-400 transition-colors duration-300 focus:outline-none"
          title="Attach File"
          aria-label="Attach file"
        >
          <FiPaperclip />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />

        <input
          type="text"
          className="flex-1 p-3 rounded-2xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage(input);
          }}
          aria-label="Message input"
          autoComplete="off"
        />

        <button
          onClick={() => sendMessage(input)}
          className={`bg-blue-600 hover:bg-blue-700 p-3 rounded-full text-white text-2xl transition duration-300 focus:outline-none
            ${!input.trim() ? "opacity-50 cursor-not-allowed" : ""}
          `}
          title="Send Message"
          aria-label="Send message"
          disabled={!input.trim()}
        >
          <IoSend />
        </button>
      </footer>
    </div>
  );
};

export default UserChat;
