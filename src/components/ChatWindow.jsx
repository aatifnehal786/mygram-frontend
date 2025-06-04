import React, { useEffect, useRef, useState, useContext } from 'react';
import io from 'socket.io-client';
import { UserContext } from '../contexts/UserContext';
import './chat.css';

const socket = io('https://mygram-1-1nua.onrender.com');

const ChatWindow = ({ selectedUser }) => {
  const { loggedUser } = useContext(UserContext);
  const currentUserId = loggedUser?.userid;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isOnline, setIsOnline] = useState(false);
//   const [allowed, setAllowed] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!selectedUser?._id || !loggedUser?.token) return;

    socket.emit('join', currentUserId);
    fetch(`https://mygram-1-1nua.onrender.com/chat/${selectedUser._id}`, {
      headers: { Authorization: `Bearer ${loggedUser.token}` },
    })
      .then((res) => {
        if (!res.ok) {
          return [];
        }
       
        return res.json();
      })
      .then((data) => setMessages(data || []))
      .catch((err) => {
        console.error('Fetch chat error:', err);
       
      });

    socket.on('receiveMessage', (msg) => {
      if (
        (msg.sender === currentUserId && msg.receiver === selectedUser._id) ||
        (msg.sender === selectedUser._id && msg.receiver === currentUserId)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [selectedUser, loggedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    socket.emit('sendMessage', {
      senderId: currentUserId,
      receiverId: selectedUser._id,
      message: input.trim(),
    });

    setInput('');
  };

  

useEffect(() => {
  socket.on('onlineUsers', (users) => {
    setIsOnline(users.includes(selectedUser?._id));
  });

  // Fetch initial online status (optional if relying only on onlineUsers broadcast)
  socket.emit('getOnlineStatus', selectedUser?._id, (status) => {
    setIsOnline(status);
  });

  return () => {
    socket.off('onlineUsers');
  };
}, [selectedUser]);


  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('https://mygram-1-1nua.onrender.com/upload/chat', {
      method: 'POST',
      body: formData,
    });
    const { fileUrl, fileType } = await res.json();

    socket.emit('sendMessage', {
      senderId: currentUserId,
      receiverId: selectedUser._id,
      fileUrl,
      fileType,
    });
  };

  if (!selectedUser) return <div className="chat-container">Select a user to start chatting</div>;
  

  return (
    <div className="chat-container">
        <div className="chat-header">
  <img src={selectedUser?.profilePic} alt={selectedUser?.username} className="chat-header-pic" />
  <div className="chat-header-info">
    <h2>{selectedUser?.username}</h2>
 <p>
  {isOnline
    ? 'Online'
    : selectedUser?.lastSeen
    ? `Last seen ${new Date(selectedUser.lastSeen).toLocaleString()}`
    : 'Offline'}
</p>

  </div>
</div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div
            key={msg._id || idx}
            className={`message-bubble ${msg.sender === currentUserId ? 'own' : 'other'}`}
          >
            {msg.message && <p>{msg.message}</p>}
            {msg.fileType?.includes('image') && <img src={msg.fileUrl} className="chat-img" />}
            {msg.fileType?.includes('video') && <video src={msg.fileUrl} controls className="chat-video" />}
            {msg.fileType?.includes('audio') && <audio src={msg.fileUrl} controls className="chat-audio" />}
            {msg.fileType?.includes('application') && (
              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                📄 File
              </a>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <label className="chat-file-label">
          📎
          <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
        </label>
        <button className="chat-send-btn" onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;
