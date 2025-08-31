import React, { useEffect, useRef, useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import './chat.css';

const ChatWindow = ({ selectedUser, triggerForwardMode, socket, messages, setMessages, onBack }) => {
  const { loggedUser } = useContext(UserContext);
  const currentUserId = loggedUser?.userid;
  const [input, setInput] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);
  const chatBtn = useRef(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
const [messageToDelete, setMessageToDelete] = useState(null);
const [toastMessage, setToastMessage] = useState('');


useEffect(() => {
  if (toastMessage) {
    const timer = setTimeout(() => setToastMessage(''), 3000);
    return () => clearTimeout(timer);
  }
}, [toastMessage]);




  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setOpenDropdownId(null);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);





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
const deleteMessage = () => {
  if (!messageToDelete) return;

  fetch("https://mygram-1-1nua.onrender.com/delete-chat", {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loggedUser?.token}`,
    },
    body: JSON.stringify({ messageIds: [messageToDelete] }),
  })
    .then(res => res.json())
    .then(data => {
      setMessages(prev => prev.filter(msg => msg._id !== messageToDelete));
      setToastMessage("Message deleted successfully.");
    })
    .catch(err => {
      console.error("Delete failed:", err);
      setToastMessage("Failed to delete message.");
    })
    .finally(() => {
      setShowConfirmModal(false);
      setMessageToDelete(null);
    });
};


const confirmDelete = (msgId) => {
  setMessageToDelete(msgId);
  setShowConfirmModal(true);
};

  const sortedMessages = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
const handleDynamicEnter = (e)=>{
  if(e.key==="Enter"){
    if(document.activeElement.name==="message"){
      chatBtn.current.click()
    }
  }

}

  return (
    <div className="chat">
      
        <div className="chat-header">
  <div className="chat-header-left">
    {/* Back button only for mobile */}
    <button className="back-btn" onClick={onBack}>←</button>

    <div className="chat-header-user-info">
      <h3>{selectedUser.username}</h3>
      <p className="user-status">
        {selectedUser.isOnline
          ? "Online"
          : selectedUser.lastSeen
          ? `Last seen ${new Date(selectedUser.lastSeen).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}`
          : "Offline"}
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
{msg.fileType?.includes('image') && (
  <img src={msg.fileUrl} alt="chat-img" className="chat-img" />
)}

{msg.fileType?.includes('video') && (
  <video src={msg.fileUrl} controls className="chat-video" />
)}

{msg.fileType?.includes('audio') && (
  <audio src={msg.fileUrl} controls className="chat-audio" />
)}

                <b className="timestamp">
                  { new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </b>

              {isDropdownOpen && (
  <div className="option-menu" ref={dropdownRef}>
    <ul>
      <li><button onClick={() => triggerForwardMode(msg)}>Forward</button></li>
      <li>
  <button onClick={() => confirmDelete(msg._id)}>Delete</button>
</li>

      {msg.fileType?.includes('image') ||
      msg.fileType?.includes('video') ||
      msg.fileType?.includes('audio') ||
      msg.fileType?.includes('application') ? (
        <li>
          <a href={msg.fileUrl} download="" target='/blank' >
            Download
          </a>
        </li>
      ) : null}
    </ul>
  </div>
)}
{showConfirmModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <p>Are you sure you want to delete this message?</p>
      <button className="confirm-btn" onClick={deleteMessage}>Yes, Delete</button>
      <button className="cancel-btn" onClick={() => setShowConfirmModal(false)}>Cancel</button>
    </div>
  </div>
)}
{toastMessage && (
  <div className="toast">{toastMessage}</div>
)}


              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      

      <div className="chat-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
          name='message'
          onKeyDown={handleDynamicEnter}
        />
        <label className="chat-file-label">
          📎
          <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
        </label>
        <button ref={chatBtn} className="chat-send-btn" onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;
