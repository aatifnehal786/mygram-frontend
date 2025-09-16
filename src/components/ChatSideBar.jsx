import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { apiFetch } from "../api/apiFetch";
import './chat.css';

const ChatSidebar = ({
  onSelectUser,
  selectedUserId,
  onSelectForwardUser,
  isForwarding = false,
}) => {
  const { loggedUser } = useContext(UserContext);
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
    <div className="chat-sidebar">
     <div className="input-wrapper">
  {searchQuery && (
    <span className="clear-btn" onClick={() => handleSearch('')}>&times;</span>
  )}
  <input
    type="text"
    value={searchQuery}
    placeholder="Search users..."
    onChange={(e) => handleSearch(e.target.value)}
    className="chat-search"
  />
</div>


      <div className="chat-list">
        {usersToDisplay.map((user) => (
          <div
            key={user._id}
            onClick={() => !isForwarding && onSelectUser(user)}
            className={`chat-user ${selectedUserId === user._id ? 'active' : ''}`}
          >
            <img className="profile-photo" src={user.profilePic} alt={user.username} />
            <div className="user-info">
              <h1>{user.username}</h1>
              <span className={`status-dot ${user.isOnline ? 'online' : 'offline'}`} />
            </div>

            {isForwarding && (
              <input
                type="checkbox"
                className="forward-checkbox"
                checked={selectedForwardUsers.includes(user._id)}
                onChange={() => toggleUserSelection(user._id)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        ))}
      </div>

      {isForwarding && (
        <div className="forward-controls">
          <button onClick={handleSend}>Send</button>
          <button onClick={handleCancel}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
