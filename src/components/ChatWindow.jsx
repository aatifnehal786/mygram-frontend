import React, { useEffect, useRef, useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { apiFetch } from "../api/apiFetch";
import './chat.css';
import { SocketProvider, useSocket } from '../contexts/SocketContext';
import { useDispatch } from "react-redux";
import { clearUnread } from "../redux/slices/notificationSlice";
import { setActiveChat, clearActiveChat } from "../redux/slices/chatSlice";



const ChatWindow = ({ selectedUser, triggerForwardMode, messages, setMessages, onBack }) => {
  const { loggedUser } = useContext(UserContext);
  const {socket} = useSocket()
  const currentUserId = loggedUser?.userid;
  const [input, setInput] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);
  const chatBtn = useRef(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
const [messageToDelete, setMessageToDelete] = useState(null);
const [toastMessage, setToastMessage] = useState('');
const [isTyping, setIsTyping] = useState(false);
const typingTimeout = useRef(null);
const [onlineMap, setOnlineMap] = useState({});
const dispatch = useDispatch();








useEffect(() => {
  if (selectedUser?._id) {
    dispatch(setActiveChat(selectedUser._id));
  }

  return () => {
    dispatch(clearActiveChat()); // chat closed
  };
}, [selectedUser, dispatch]);

useEffect(() => {
  if (toastMessage) {
    const timer = setTimeout(() => setToastMessage(''), 3000);
    return () => clearTimeout(timer);
  }
}, [toastMessage]);


// console.log(messages)

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

 // File upload
const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const { fileUrl, fileType } = await apiFetch("api/chats/upload", {
      method: "POST",
      body: formData,
    });

    socket.emit("sendMessage", {
      senderId: currentUserId,
      receiverId: selectedUser._id,
      fileUrl,
      fileType,
    });
  } catch (err) {
    console.error("File upload failed:", err.message);
    setToastMessage("Failed to upload file.");
  }
};

// Delete chat message
const deleteMessage = async () => {
  if (!messageToDelete) return;

  try {
    await apiFetch("api/chats/delete-chat", {
      method: "DELETE",
      body: JSON.stringify({ messageIds: [messageToDelete] }),
    });

    setMessages((prev) => prev.filter((msg) => msg._id !== messageToDelete));
    setToastMessage("Message deleted successfully.");
  } catch (err) {
    console.error("Delete failed:", err.message);
    setToastMessage("Failed to delete message.");
  } finally {
    setShowConfirmModal(false);
    setMessageToDelete(null);
  }
};


// use effect for online and offline status
useEffect(() => {
  if (!socket) return;

  socket.emit("get-online-users");

  socket.on("online-users", (userIds) => {
    setOnlineMap(prev => {
      const map = { ...prev };
      userIds.forEach(id => {
        map[id] = { isOnline: true, lastSeen: null };
      });
      return map;
    });
  });

  return () => {
    socket.off("online-users");
  };
}, [socket]);


// use Effect for Typing indicators

useEffect(() => {
  if (!socket || !selectedUser) return;

  const handleTyping = (senderId) => {
    if (senderId === selectedUser._id) setIsTyping(true);
  };

  const handleStopTyping = (senderId) => {
    if (senderId === selectedUser._id) setIsTyping(false);
  };

  socket.on("typing", handleTyping);
  socket.on("stopTyping", handleStopTyping);

  return () => {
    socket.off("typing", handleTyping);
    socket.off("stopTyping", handleStopTyping);
  };
}, [socket, selectedUser,input]);


useEffect(() => {
  setIsTyping(false); // reset typing when switching users
}, [selectedUser]);

useEffect(() => {
  if (selectedUser?._id) {
    dispatch(setActiveChat(selectedUser._id));
    dispatch(clearUnread(selectedUser._id));
  }
}, [selectedUser]);

useEffect(() => {
  if (!socket || !selectedUser) return;

  socket.emit("markSeen", {
    userId: currentUserId,
    otherUserId: selectedUser._id
  });
}, [socket, selectedUser, currentUserId]);





const confirmDelete = (msgId) => {
  setMessageToDelete(msgId);
  setShowConfirmModal(true);
};

// Utility function to detect and render links
const renderMessageWithLinks = (text) => {
  if (!text) return null;

  // Regex to detect URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Split text by URLs and map
  return text.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="chat-link"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString();
}

  const sortedMessages = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
const handleDynamicEnter = (e)=>{
  if(e.key==="Enter"){
    if(document.activeElement.name==="message"){
      chatBtn.current.click()
    }
  }

}

useEffect(() => {
  if (!socket) return;

  const handler = ({ userId }) => {
    setMessages(prev =>
      prev.map(m =>
        m.sender === currentUserId ? { ...m, isSeen: true } : m
      )
    );
  };

  socket.on("messagesSeen", handler);

  return () => {
    socket.off("messagesSeen", handler);
  };
}, [socket]);

useEffect(() => {
  if (!socket || !selectedUser) return;

  socket.emit("chatOpen", {
    chattingWith: selectedUser._id
  });

  socket.emit("markSeen", {
    userId: currentUserId,
    otherUserId: selectedUser._id
  });

  return () => {
    socket.emit("chatClose", {
      chattingWith: selectedUser._id
    });
  };
}, [selectedUser, socket, currentUserId]);


  return (
    <div className="chat">
      
        <div className="chat-header">
  <div className="chat-header-left">
    {/* Back button only for mobile */}
    <button className="back-btn" onClick={onBack}>←</button>

    <div className="chat-header-user-info">
      <h3>{selectedUser.username}</h3>
 <p className="user-status">
  {isTyping ? (
    "typing..."
  ) : onlineMap[selectedUser._id]?.isOnline ? (
    "Online"
  ) : onlineMap[selectedUser._id]?.lastSeen ? (
    `Last seen ${formatTime(onlineMap[selectedUser._id].lastSeen)}`
  ) : (
    "Offline"
  )}
</p>




    </div>
  </div>
</div>

        <div className="chat-messages">
          {sortedMessages.map((msg, idx) => {
            const senderId = msg.sender?._id || msg.sender; // handle both cases
            const isOwnMessage = senderId === currentUserId;
            const isDropdownOpen = openDropdownId === msg._id;
           

            return (
              <div key={msg._id || idx} className={`message-bubble ${isOwnMessage ? 'own' : 'other'}`}>
               

                <button className="message-options-btn"
                  onClick={() => setOpenDropdownId(openDropdownId === msg._id ? null : msg._id)}>⋮
                </button>

               <p>{renderMessageWithLinks(msg.message)}</p>
{msg.fileType?.includes('image') && (
  <img src={msg.fileUrl} alt="chat-img" className="chat-img" />
)}

{msg.fileType?.includes('video') && (
  <video src={msg.fileUrl} controls className="chat-video" />
)}

{msg.fileType?.includes('audio') && (
  <audio src={msg.fileUrl} controls className="chat-audio" />
)}

{msg.fileType?.includes('pdf') && (
  <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="chat-doc-link">
    View PDF
  </a>
)}


               <b className="timestamp">
                   { new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isOwnMessage && (
                    msg.isSeen ? " ✓✓" :
                      msg.isDelivered ? " ✓✓ (grey)" :
                        " ✓"
                  )}
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
          <a href={msg.fileUrl} download="" >
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
  onChange={(e) => {
    
  const text = e.target.value;
  setInput(text);

 if (!socket || !selectedUser) return;

  if (text.length > 0) {
    socket.emit("typing", {
      senderId: currentUserId,
      receiverId: selectedUser._id
    });
  }

  clearTimeout(typingTimeout.current);

  typingTimeout.current = setTimeout(() => {
    if (!socket) return;

    socket.emit("stopTyping", {
      senderId: currentUserId,
      receiverId: selectedUser._id
    });
  }, 1000);
}}

  placeholder="Type a message..."
  className="chat-input"
  onKeyDown={handleDynamicEnter}
  name='message'
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
