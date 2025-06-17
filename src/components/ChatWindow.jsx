import React, { useEffect, useRef, useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import './chat.css';
import forward from '../assets/forward.png'

const ChatWindow = ({ selectedUser, triggerForwardMode, socket, chatList, messages,setMessages }) => {
  const { loggedUser } = useContext(UserContext);
  const currentUserId = loggedUser?.userid;
 

  const [input, setInput] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!selectedUser || !loggedUser?.token || !socket) return;

    socket.emit('join', currentUserId);

    fetch(`https://mygram-1-1nua.onrender.com/chat/${selectedUser._id}`, {
      headers: { Authorization: `Bearer ${loggedUser.token}` },
    })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setMessages(data || []))
      .catch((err) => console.error('Fetch chat error:', err));

    socket.on('receiveMessage', (msg) => {
      const isCurrentChat =
        (msg.sender === currentUserId && msg.receiver === selectedUser._id) ||
        (msg.receiver === currentUserId && msg.sender === selectedUser._id);

      if (isCurrentChat) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [selectedUser, loggedUser, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const msg = {
      senderId: currentUserId,
      receiverId: selectedUser._id,
      message: input.trim(),
    };

    socket.emit('sendMessage', msg);
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

  const handleForwardMessage = (msg) => {
    triggerForwardMode(msg);
  };

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  if (!selectedUser) return <div className="chat-container">Select a user to start chatting</div>;

  return (
    <div className="chat">
      <div className="chat-container">
        <div className="chat-header">
        <img src={selectedUser.profilePic} alt={selectedUser.username} className="chat-header-pic" />
        <div className="chat-header-info">
          <h2>{selectedUser.username}</h2>
          <p>{isOnline ? 'Online' : selectedUser.lastSeen ? `Last seen ${new Date(selectedUser.lastSeen).toLocaleString()}` : 'Offline'}</p>
        </div>
      </div>

      <div className="chat-messages">
        {sortedMessages.map((msg, idx) => (
          <div
            key={msg._id || idx}
            className={`message-bubble ${msg.sender === currentUserId ? 'own' : 'other'}`}
          >
            {msg.message && <p>{msg.message}</p>}
            {msg.fileType?.includes('image') && <img src={msg.fileUrl} className="chat-img" />}
            {msg.fileType?.includes('video') && <video src={msg.fileUrl} controls className="chat-video" />}
            {msg.fileType?.includes('audio') && <audio src={msg.fileUrl} controls className="chat-audio" />}
            {msg.fileType?.includes('application') && (
              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">📄 File</a>
            )}
             <small className="timestamp">
           {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </small>
            <button className='forward-btn' onClick={() => handleForwardMessage(msg)}><img className='forward-img' src={forward}/></button>
          </div>
        ))}
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
