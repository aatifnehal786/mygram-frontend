import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import './chat.css';

const ChatSidebar = ({ onSelectUser, selectedUserId, onSelectForwardUser, isForwarding = false }) => {
  const { loggedUser } = useContext(UserContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [followedUsers, setFollowedUsers] = useState([]);

  useEffect(() => {
    if (!loggedUser?.token) return;

    fetch(`https://mygram-1-1nua.onrender.com/followers/${loggedUser.userid}`, {
      headers: { Authorization: `Bearer ${loggedUser.token}` },
    })
      .then(res => res.json())
      .then(data => setFollowedUsers(data.followers || []))
      .catch(err => console.error('Error fetching followed users:', err));
  }, [loggedUser]);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) return setResults([]);
    try {
      const res = await fetch(`https://mygram-1-1nua.onrender.com/search-users?q=${q}`, {
        headers: { Authorization: `Bearer ${loggedUser.token}` },
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const usersToDisplay = searchQuery ? results : followedUsers;

  return (
    <div className="chat-sidebar">
      <input
        type="text"
        value={searchQuery}
        placeholder="Search users..."
        onChange={(e) => handleSearch(e.target.value)}
        className="chat-search"
      />
      <div className="chat-list">
        {usersToDisplay.map(user => (
          <div
            key={user._id}
            onClick={() => !isForwarding && onSelectUser(user)}
            className={`chat-user ${selectedUserId === user._id ? 'active' : ''}`}
          >
            <img className="profile-photo" src={user.profilePic} alt={user.username} />
            <div className="user-info">
              <h1>{user.username}</h1>
              <span className={`status-dot ${user.isOnline ? 'online' : 'offline'}`}></span>
              {isForwarding && onSelectForwardUser && (
                <button
                  className="forward-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectForwardUser(user);
                  }}
                >
                  Forward Here
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;
