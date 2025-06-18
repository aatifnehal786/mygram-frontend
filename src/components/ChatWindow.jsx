import React, { useEffect, useRef, useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import './chat.css';

const ChatWindow = ({ selectedUser, triggerForwardMode, socket, chatList, messages, setMessages, followers = [] }) => {
  const { loggedUser } = useContext(UserContext);
  const currentUserId = loggedUser?.userid;

  const [input, setInput] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardPreview, setForwardPreview] = useState(null);
  const [forwardCaption, setForwardCaption] = useState('');
  const [forwardRecipient, setForwardRecipient] = useState(currentUserId);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!selectedUser || !loggedUser?.token || !socket) return;

    socket.emit('join', currentUserId);

    fetch(`https://mygram-1-1nua.onrender.com/chat/${selectedUser._id}`, {
      headers: { Authorization: `Bearer ${loggedUser.token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
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

    const fileType = file.type;

    setPreviewFile({ file, fileType });
    setPreviewVisible(true);
  };

  const confirmFileSend = async () => {
    const formData = new FormData();
    formData.append('file', previewFile.file);

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
      message: caption,
    });

    setPreviewVisible(false);
    setPreviewFile(null);
    setCaption('');
  };

  const handleForwardMessage = (msg) => {
    setOpenDropdownId(null);
    setForwardPreview(msg);
    setForwardCaption(msg.message || '');
    setShowForwardModal(true);
    setForwardRecipient(currentUserId);
  };

  const confirmForward = () => {
    if (!forwardPreview || !forwardRecipient) return;

    const forwardMsg = {
      senderId: currentUserId,
      receiverId: forwardRecipient,
    };

    if (forwardCaption) {
      forwardMsg.message = forwardCaption;
    }

    if (forwardPreview.fileUrl && forwardPreview.fileType) {
      forwardMsg.fileUrl = forwardPreview.fileUrl;
      forwardMsg.fileType = forwardPreview.fileType;
    }

    socket.emit('sendMessage', forwardMsg);

    setShowForwardModal(false);
    setForwardPreview(null);
    setForwardCaption('');
    setForwardRecipient(currentUserId);
  };

  const sortedMessages = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="chat">
      <div className="chat-container">
        <div className="chat-messages">
          {sortedMessages.map((msg, idx) => (
            <div key={msg._id || idx} className={`message-bubble ${msg.sender === currentUserId ? 'own' : 'other'}`}>
              {msg.message && <p>{msg.message}</p>}
              {msg.fileType?.includes('image') && <img src={msg.fileUrl} className="chat-img" />}
              {msg.fileType?.includes('video') && <video src={msg.fileUrl} controls className="chat-video" />}
              {msg.fileType?.includes('audio') && <audio src={msg.fileUrl} controls className="chat-audio" />}
              {msg.fileType?.includes('application') && (
                <a href={msg.fileUrl} target="_blank" rel="noreferrer">📄 File</a>
              )}
              <button onClick={() => handleForwardMessage(msg)}>↪ Forward</button>
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
          />
          <input type="file" onChange={handleFileUpload} />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewVisible && previewFile && (
        <div className="modal-overlay">
          <div className="modal-content">
            {previewFile.fileType.includes('image') && <img src={URL.createObjectURL(previewFile.file)} className="chat-img" />}
            {previewFile.fileType.includes('video') && <video src={URL.createObjectURL(previewFile.file)} controls className="chat-video" />}
            {previewFile.fileType.includes('audio') && <audio src={URL.createObjectURL(previewFile.file)} controls className="chat-audio" />}
            {previewFile.fileType.includes('application') && <p>{previewFile.file.name}</p>}
            <textarea
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <button onClick={confirmFileSend}>Send</button>
            <button onClick={() => setPreviewVisible(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Forward Preview Modal */}
      {showForwardModal && forwardPreview && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Forward Message</h3>
            <select value={forwardRecipient} onChange={(e) => setForwardRecipient(e.target.value)}>
  <option value={currentUserId}>Send to Myself</option>
  {(followers || []).map(user => (
    <option key={user._id} value={user._id}>{user.username}</option>
  ))}
</select>

            {forwardPreview.fileType?.includes('image') && <img src={forwardPreview.fileUrl} className="chat-img" />}
            {forwardPreview.fileType?.includes('video') && <video src={forwardPreview.fileUrl} controls className="chat-video" />}
            {forwardPreview.fileType?.includes('audio') && <audio src={forwardPreview.fileUrl} controls className="chat-audio" />}
            {forwardPreview.fileType?.includes('application') && (
              <a href={forwardPreview.fileUrl} target="_blank" rel="noreferrer">📄 File</a>
            )}
            <textarea
              value={forwardCaption}
              onChange={(e) => setForwardCaption(e.target.value)}
              placeholder="Add a caption to forwarded message"
            />
            <button onClick={confirmForward}>Forward</button>
            <button onClick={() => setShowForwardModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;