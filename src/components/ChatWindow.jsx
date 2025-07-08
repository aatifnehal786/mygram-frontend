import React, { useEffect, useRef, useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import './chat.css';

const ChatWindow = ({ selectedUser, triggerForwardMode, socket, messages, setMessages }) => {
  const { loggedUser } = useContext(UserContext);
  const currentUserId = loggedUser?.userid;
  const [input, setInput] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const messagesEndRef = useRef(null);

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

  const sortedMessages = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  setMessages(sortedMessages)

  return (
    <div className="chat">
      
      <div className="chat-container">
        <div className="chat-header3">
        <div className="chat-header-left">
    <img
      src={selectedUser.profilePic}
      alt={selectedUser.username}
      className="chat-header-profile-pic"
    />
    <div className="chat-header-user-info">
      <h3>{selectedUser.username}</h3>
      <p className="user-status">
        {selectedUser.isOnline
          ? 'Online'
          : selectedUser.lastSeen
          ? `Last seen ${new Date(selectedUser.lastSeen).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : 'Offline'}
      </p>
    </div>
  </div>
      </div>
        <div className="chat-messages">
          {sortedMessages.map((msg, idx) => {
            const isOwnMessage = msg.sender === currentUserId;
            const isDropdownOpen = openDropdownId === msg._id;

            return (
              <div key={msg._id || idx} className={`message-bubble ${isOwnMessage ? 'own' : 'other'}`}>
                <button className="message-options-btn"
                  onClick={() => setOpenDropdownId(openDropdownId === msg._id ? null : msg._id)}>⋮
                </button>

                <p>{msg.message}</p>
                {msg.fileType?.includes('image') && <img src={msg.fileUrl} className="chat-img" />}
                {msg.fileType?.includes('video') && <video src={msg.fileUrl} controls className="chat-video" />}
                {msg.fileType?.includes('audio') && <audio src={msg.fileUrl} controls className="chat-audio" />}
                {msg.fileType?.includes('application') && (
                  <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">📄 File</a>
                )}

                <small className="timestamp">
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </small>

                {isDropdownOpen && (
                  <div className="option-menu">
                    <ul>
                      <li><button onClick={() => triggerForwardMode(msg)}>Forward</button></li>
                      <li>
                        <a href={msg.fileUrl} download target="_blank" rel="noopener noreferrer">
                          Download
                        </a>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
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
