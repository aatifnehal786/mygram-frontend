import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import io from 'socket.io-client';
import ChatSidebar from './ChatSideBar';
import './chat.css'; // External styling

const socket = io('https://mygram-1-1nua.onrender.com');

const Chat = () => {
  const { targetUserId } = useParams();
  const { loggedUser } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [allowed, setAllowed] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUserId = loggedUser?.userid;
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if (!loggedUser?.token || !targetUserId) return;

    if (!hasJoinedRef.current) {
      socket.emit('join', currentUserId);
      hasJoinedRef.current = true;
    }

    const fetchChat = async () => {
      try {
        const res = await fetch(`https://mygram-1-1nua.onrender.com/chat/${targetUserId}`, {
          headers: { Authorization: `Bearer ${loggedUser.token}` },
        });

        if (!res.ok) {
          setAllowed(false);
          return;
        }

        const data = await res.json();
        setMessages(data);
        setAllowed(true);
      } catch (err) {
        console.error('Chat fetch error:', err);
        setAllowed(false);
      }
    };

    fetchChat();

    socket.on('receiveMessage', (msg) => {
      if (
        (msg.sender === currentUserId && msg.receiver === targetUserId) ||
        (msg.sender === targetUserId && msg.receiver === currentUserId)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [loggedUser, currentUserId, targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('https://mygram-1-1nua.onrender.com/upload/chat', {
        method: 'POST',
        body: formData,
      });

      const { fileUrl, fileType } = await res.json();

      socket.emit('sendMessage', {
        senderId: currentUserId,
        receiverId: targetUserId,
        fileUrl,
        fileType,
      });
    } catch (err) {
      console.error('File upload error:', err);
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    socket.emit('sendMessage', {
      senderId: currentUserId,
      receiverId: targetUserId,
      message: input.trim(),
    });

    setInput('');
  };

  if (!allowed) {
    return <p className="chat-warning">You can only chat with users who follow each other.</p>;
  }

  return (
    <div className="chat-wrapper">
      <ChatSidebar />
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div
              key={msg._id || index}
              className={`message-bubble ${msg.sender === currentUserId ? 'own' : 'other'}`}
            >
              {msg.message && <p>{msg.message}</p>}
              {msg.fileType?.includes('image') && <img src={msg.fileUrl} alt="sent" className="chat-img" />}
              {msg.fileType?.includes('video') && <video src={msg.fileUrl} controls className="chat-video" />}
              {msg.fileType?.includes('audio') && <audio src={msg.fileUrl} controls className="chat-audio" />}
              {msg.fileType?.includes('application') && (
                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="chat-file-link">
                  📄 Download File
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
            <input
              type="file"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>

          <button onClick={sendMessage} className="chat-send-btn">Send</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
