import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';


const socket = io('http://localhost:8000'); // Replace with your server URL

const Chat = ({ currentUserId, targetUserId, token }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [allowed, setAllowed] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit('join', currentUserId);

    const fetchChat = async () => {
      try {
        const res = await fetch(`/chat/${targetUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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
  }, [currentUserId, targetUserId, token]);

  const sendMessage = () => {
    if (!input.trim()) return;

    socket.emit('sendMessage', {
      senderId: currentUserId,
      receiverId: targetUserId,
      message: input.trim()
    });

    setInput('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!allowed) {
    return <p className="chat-warning">You can only chat with users who follow each other.</p>;
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${msg.sender === currentUserId ? 'sent' : 'received'}`}
          >
            {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button onClick={sendMessage} className="chat-send-btn">Send</button>
      </div>
    </div>
  );
};

export default Chat;
