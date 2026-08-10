import React, { useState } from 'react';
import { apiFetch } from "../api/apiFetch";
import useChatStore from "../store/chatStore";
import usePresenceStore from "../store/usePresenceStore"; // ADD THIS

const ChatSidebar = ({ onSelectForwardUser, theme }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedForwardUsers, setSelectedForwardUsers] = useState([]);

  const { followedUsers, selectedUser, setSelectedUser, isForwarding, setForwardMode } = useChatStore();
  const { onlineUsers } = usePresenceStore(); // LIVE ONLINE LIST

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) return setResults([]);
    try {
      const data = await apiFetch(`api/chats/search-users?q=${encodeURIComponent(q)}`);
      setResults(data);
    } catch (err) {
      console.error("Search error:", err.message);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedForwardUsers((prev) => prev.includes(userId)? prev.filter((id) => id!== userId) : [...prev, userId]);
  };

  const handleSend = () => {
    if (selectedForwardUsers.length === 0) return;
    onSelectForwardUser(selectedForwardUsers);
    setSelectedForwardUsers([]);
    setForwardMode(false, null);
  };

  const handleCancel = () => {
    setSelectedForwardUsers([]);
    setForwardMode(false, null);
    onSelectForwardUser([]);
  };

  const usersToDisplay = searchQuery? results : followedUsers;

  return (
    <div className={`flex flex-col h- ${theme === 'dark'? 'bg-gray-800' : 'bg-white'}`}>
      <div className="p-3 border-b">
        <div className="relative">
          {searchQuery && (
            <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">×</button>
          )}
          <input type="text" value={searchQuery} placeholder="Search users..." onChange={(e) => handleSearch(e.target.value)} className="w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {usersToDisplay.map((user) => {
          const isOnline = onlineUsers.includes(user._id); // DYNAMIC CHECK
          return (
            <div
              key={user._id}
              onClick={() => { if (!isForwarding) setSelectedUser(user); }}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 ${selectedUser?._id === user._id? "bg-gray-200" : ""}`}
            >
              <div className="relative">
                <img src={user.profilePic || "/placeholder.svg"} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline? "bg-green-500" : "bg-gray-400"}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h1 className={`text-sm font-medium truncate ${theme === 'dark'? 'text-red-500' : 'text-gray-800'}`}>{user.username}</h1>
                  {user.unreadCount > 0 && (
                    <div className="bg-green-500 text-white text-xs rounded-full min-w- h-5 flex items-center justify-center px-1">{user.unreadCount}</div>
                  )}
                </div>
                <p className="text-xs text-gray-400">{isOnline? "Online" : "Offline"}</p>
              </div>

              {isForwarding && (
                <input type="checkbox" checked={selectedForwardUsers.includes(user._id)} onChange={() => toggleUserSelection(user._id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 accent-blue-600" />
              )}
            </div>
          );
        })}
      </div>

      {isForwarding && (
        <div className="p-3 border-t flex gap-2">
          <button onClick={handleSend} className="flex-1 bg-blue-600 text-white py-2 rounded-lg">Send</button>
          <button onClick={handleCancel} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancel</button>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;