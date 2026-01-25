import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { apiFetch } from "../api/apiFetch";
import './chat.css';

import { useSelector } from "react-redux";


const ChatSidebar = ({onSelectUser,selectedUserId,onSelectForwardUser,isForwarding = false,onBack}) => {
  const { loggedUser } = useContext(UserContext);
  const unreadCounts = useSelector(state => state.notifications.unreadCounts);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [followedUsers, setFollowedUsers] = useState([]);
  const [selectedForwardUsers, setSelectedForwardUsers] = useState([]);
 

 useEffect(() => {
  if (!loggedUser?.token) return;

  const fetchFollowedUsers = async () => {
    try {
      const data = await apiFetch(`api/followers/${loggedUser.userid}`);
      setFollowedUsers(data.followers || []);
    } catch (err) {
      console.error("Error fetching followed users:", err.message);
    }
  };

  fetchFollowedUsers();
}, [loggedUser]);

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
    setSelectedForwardUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSend = () => {
    if (selectedForwardUsers.length > 0) {
      onSelectForwardUser(selectedForwardUsers);
      setSelectedForwardUsers([]);
    }
  };

  const handleCancel = () => {
    setSelectedForwardUsers([]);
    onSelectForwardUser([]); // empty array triggers cancel
  };

  const usersToDisplay = searchQuery ? results : followedUsers;

 
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          {searchQuery && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
          )}

          <input
            type="text"
            value={searchQuery}
            placeholder="Search users..."
            onChange={(e) => handleSearch(e.target.value)}
            className="
              w-full rounded-lg border border-gray-300
              px-4 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {usersToDisplay.map((user) => (
          <div
            key={user._id}
            onClick={() => !isForwarding && onSelectUser(user)}
            className={`
              flex items-center gap-3 px-4 py-3 cursor-pointer
              hover:bg-gray-100 transition
              ${selectedUserId === user._id ? "bg-gray-200" : ""}
            `}
          >
            {/* Profile */}
            <div className="relative">
              <img
                src={user.profilePic}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span
                className={`
                  absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white
                  ${user.isOnline ? "bg-green-500" : "bg-gray-400"}
                `}
              />
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h1 className="text-sm font-medium truncate">
                  {user.username}
                </h1>

                {unreadCounts?.[user._id] > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCounts[user._id]}
                  </span>
                )}
              </div>
            </div>

            {/* Forward Checkbox */}
            {isForwarding && (
              <input
                type="checkbox"
                checked={selectedForwardUsers.includes(user._id)}
                onChange={() => toggleUserSelection(user._id)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 accent-blue-600"
              />
            )}
          </div>
        ))}
      </div>

      {/* Forward Controls */}
      {isForwarding && (
        <div className="p-3 border-t flex gap-2">
          <button
            onClick={handleSend}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Send
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};




export default ChatSidebar;
