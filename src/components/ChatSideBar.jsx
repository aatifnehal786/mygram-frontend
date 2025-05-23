import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import './chat.css';

const ChatSidebar = ( { onSelectUser, selectedUserId } ) => {
  const { loggedUser } = useContext(UserContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [chatList, setChatList] = useState([]);

  useEffect(() => {
    if (!loggedUser?.token) return;
    fetch('https://mygram-1-1nua.onrender.com/chat-list', {
      headers: { Authorization: `Bearer ${loggedUser.token}` },
    })
      .then((res) => res.json())
      .then(setChatList)
      .catch((err) => console.error('Chat list error:', err));
  }, [loggedUser]);

   const handleUserClick = (userId) => {
    onUserSelect(userId); // Notify parent
  };

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

  const usersToDisplay = searchQuery ? results : chatList;

  return (
    <div className="chat-sidebar">
      <input
        type="text"
        value={searchQuery}
        placeholder="Search users..."
        onChange={(e) => handleSearch(e.target.value)}
      />

      <div className="chat-list">
    {usersToDisplay.map(user => (
  <div
    key={user._id}
    onClick={() => onSelectUser(user)}
    className={`chat-user ${selectedUserId === user._id ? 'active' : ''}`}
  >
    <img className="profile-photo" src={user.profilePic} alt={user.username} />
    <div className="user-info">
      <h1>{user.username}</h1>
      <span className={`status-dot ${user.isOnline ? 'online' : 'offline'}`}></span>
    </div>
  </div>
))}

      </div>
    </div>
  );
};

export default ChatSidebar;
