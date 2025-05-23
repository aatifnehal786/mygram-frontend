import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

const ChatSidebar = () => {
  const { loggedUser } = useContext(UserContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [chatList, setChatList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loggedUser?.token) return;

    fetch('https://mygram-1-1nua.onrender.com/chat-list', {
      headers: { Authorization: `Bearer ${loggedUser.token}` }
    })
      .then(res => res.json())
      .then(setChatList)
      .catch(err => console.error('Chat list error:', err));
  }, [loggedUser]);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) return setResults([]);

    try {
      const res = await fetch(`https://mygram-1-1nua.onrender.com/search-users?q=${q}`, {
        headers: { Authorization: `Bearer ${loggedUser.token}` }
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('User search failed:', err);
    }
  };

  const goToChat = (userId) => {
    navigate(`/chat/${userId}`);
  };

  const usersToDisplay = Array.isArray(searchQuery ? results : chatList) ? (searchQuery ? results : chatList) : [];


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
      <div key={user._id} onClick={() => goToChat(user._id)} className="chat-user">
        <img className='profile-photo ' src={user.profilePic} alt={user.name} />
        <span>{user.username}</span>
      </div>
    ))}
  </div>

    </div>
  );
};

export default ChatSidebar;
