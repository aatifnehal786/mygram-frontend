import React, { useEffect, useState, useRef, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { socket } from '../socket'; // Ensure this exports a connected socket.io instance

const ChatBox = ({ user }) => {
  const { loggedUser } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch previous chat messages
  useEffect(() => {
    fetch(`https://mygram-1-1nua.onrender.com/chat/${user._id}`, {
      headers: { Authorization: `Bearer ${loggedUser.token}` }
    })
      .then(res => res.json())
      .then(setMessages)
      .catch(err => console.error('Fetch messages error:', err));
  }, [user, loggedUser.token]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Receive new messages via socket
  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      if (msg.sender === user._id || msg.receiver === user._id) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [user]);

  const sendMessage = async () => {
    if (!newMsg.trim() && !file) return;

    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('https://mygram-1-1nua.onrender.com/upload/chat', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        socket.emit('sendMessage', {
          senderId: loggedUser.id,
          receiverId: user._id,
          message: newMsg,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
        });

      } catch (err) {
        console.error('File upload failed:', err);
      }

      setFile(null);
    } else {
      socket.emit('sendMessage', {
        senderId: loggedUser.id,
        receiverId: user._id,
        message: newMsg,
      });
    }

    setNewMsg('');
  };

  const renderMessage = (msg, i) => {
    const isOwn = msg.sender === loggedUser.id;
    return (
      <div className="chat-messages">
  {messages.map((msg, i) => (
    <div
      key={i}
      className={`message-bubble ${msg.sender === loggedUser.id ? 'own' : ''}`}
    >
      {/* If there's text, render it */}
      {msg.message && <p>{msg.message}</p>}

      {/* If it's an image, render an <img> tag */}
      {msg.fileType?.startsWith('image') && msg.fileUrl && (
        <img  src={msg.fileUrl} alt="sent media" className="chat-image" />
      )}

      {/* If it's a video */}
      {msg.fileType?.startsWith('video') && msg.fileUrl && (
        <video controls className="chat-video">
          <source src={msg.fileUrl} type={msg.fileType} />
          Your browser does not support the video tag.
        </video>
      )}

      {/* If it's audio */}
      {msg.fileType?.startsWith('audio') && msg.fileUrl && (
        <audio controls className="chat-audio">
          <source src={msg.fileUrl} type={msg.fileType} />
          Your browser does not support the audio tag.
        </audio>
      )}
    </div>
  ))}
  <div ref={messagesEndRef} />
</div>

    );
  };

  return (
    <div className="chat-main">
      <div className="chat-header">Chat with {user.username}</div>
      <div className="chat-messages">
        {messages.map((msg, i) => renderMessage(msg, i))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={newMsg}
          placeholder="Type a message..."
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <input
          type="file"
          accept="image/*,video/*,audio/*,application/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatBox;
