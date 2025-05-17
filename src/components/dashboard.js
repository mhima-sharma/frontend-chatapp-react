import React, { useEffect, useState } from 'react';
import { Search, Pin } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const navigate = useNavigate();
  const [chatData, setChatData] = useState([]);
  const [groupData, setGroupData] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/auth/users/${currentUser.id}`);
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();

        const formatted = data.map(user => ({
          id: user._id || user.id,
          name: user.name,
          lastMessage: 'Say hi 👋',
          date: 'Now',
          pinned: false
        }));

        setChatData(formatted);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const fetchGroups = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/chat/groups/:groupId`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch groups');
        const data = await response.json();

        // Filter out duplicate groups by unique id
        const uniqueGroups = data.filter((group, index, self) =>
          index === self.findIndex((g) => g.id === group.id)
        );

        setGroupData(uniqueGroups);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };

    if (currentUser && currentUser.id && token) {
      fetchUsers();
      fetchGroups();
    }
  }, [currentUser?.id, token]);

  const tabs = ['All', 'Unread', 'Favorites', 'Groups'];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <Header />

      <motion.div 
        className="flex flex-col sm:flex-row flex-1"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Sidebar */}
        <aside className="w-full sm:w-64 bg-gray-900 p-4 sm:p-6 space-y-3 shadow-lg border-b sm:border-r border-gray-700">
          {tabs.map((label) => (
            <motion.button
              key={label}
              className={`w-full bg-gray-800 hover:bg-gray-700 transition text-sm sm:text-base font-medium text-white px-4 py-2 rounded-md shadow-md ${activeTab === label ? 'bg-indigo-600' : ''}`}
              onClick={() => setActiveTab(label)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {label}
            </motion.button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 flex flex-col">
          {/* Search */}
          <motion.div 
            className="flex gap-2 mb-6 bg-gray-800 p-3 rounded-lg shadow-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <input
              placeholder="Search or start a new chat"
              className="flex-grow bg-transparent text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button className="bg-indigo-600 hover:bg-indigo-500 p-3 rounded-md">
              <Search className="text-white w-5 h-5" />
            </button>
          </motion.div>

          {/* Chat / Group List */}
          <motion.div 
            className="flex flex-col gap-3"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
          >
            {activeTab === 'Groups' ? (
              groupData.length > 0 ? (
                groupData.map((group) => (
                  <motion.div
                    key={group.id}
                    onClick={() => navigate(`/groupchat?groupId=${group.id}&groupName=${encodeURIComponent(group.name)}`)}
                    className="bg-gray-800 hover:bg-gray-700 transition p-4 rounded-xl cursor-pointer shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex-1">
                      <div className="text-lg font-semibold">{group.name}</div>
                      {group.members && (
                        <div className="text-sm text-gray-400">{group.members} members</div>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-gray-400">No groups found.</div>
              )
            ) : (
              chatData.map((chat) => (
                <motion.div
                  key={chat.id}
                  onClick={() => navigate(`/userchat?receiverId=${chat.id}&receiverName=${encodeURIComponent(chat.name)}`)}
                  className="bg-gray-800 hover:bg-gray-700 transition p-4 rounded-xl cursor-pointer shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex-1">
                    <div className="text-lg font-semibold">{chat.name}</div>
                    <div className="text-sm text-gray-400">{chat.lastMessage}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <span className="text-sm text-gray-400">{chat.date}</span>
                    {chat.pinned && <Pin className="text-yellow-400 w-4 h-4" />}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </main>
      </motion.div>

      <Footer />
    </div>
  );
};

export default Dashboard;
