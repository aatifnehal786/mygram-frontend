// ✅ Chat.js
import React, { useState, useEffect, useRef } from 'react';
import ChatSidebar from './ChatSideBar';
import ChatWindow from './ChatWindow';
import io from 'socket.io-client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiFetch } from '../api/apifetch';
import './chat.css';

const Chat = ({onLock, canRemovePin, onRemovePin }) => {
  const [selectedUser, setSelectedUser] = useState(
    JSON.parse(localStorage.getItem('selected-chat-user')) || null
  );
  const [chatList, setChatList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
 
  const [loggedUser, setLoggedUser] = useState(
    JSON.parse(sessionStorage.getItem('token-auth'))
  );
  const [isForwarding, setIsForwarding] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);


  const socketRef = useRef(null);
  
// Fetch chat messages with selected user
useEffect(() => {
  if (!selectedUser || !loggedUser?.token) return;

  const fetchChat = async () => {
    try {
      const data = await apiFetch(`/chat/${selectedUser._id}`);
      setMessages(data || []);
    } catch (err) {
      console.error('Fetch chat error:', err);
      setMessages([]);
    }
  };

  fetchChat();

  socketRef.current.emit('join', loggedUser.userid);

  const handleReceiveMessage = (msg) => {
    const isCurrentChat =
      (msg.sender === loggedUser.userid && msg.receiver === selectedUser._id) ||
      (msg.receiver === loggedUser.userid && msg.sender === selectedUser._id);
    if (isCurrentChat) {
      setMessages(prev => [...prev, msg]);
    }
  };

  socketRef.current.on('receiveMessage', handleReceiveMessage);

  return () => {
    socketRef.current.off('receiveMessage', handleReceiveMessage);
  };
}, [selectedUser]);

// Forward message to multiple users
const forwardMessageToUsers = async (msg, receiverIds) => {
  const receivers = Array.isArray(receiverIds) ? receiverIds : [receiverIds];
  setIsForwarding(true);

  try {
    for (const receiverId of receivers) {
      if (receiverId === loggedUser.userid) continue;

      const newMsg = await apiFetch("/chat/forward", {
        method: "POST",
        body: JSON.stringify({
          senderId: loggedUser.userid,
          receiverId,
          message: msg.message || '',
          fileUrl: msg.fileUrl || null,
          fileType: msg.fileType || null,
          isForwarded: true,
        }),
      });

      socketRef.current?.emit("sendMessage", newMsg);

      if (selectedUser?._id === receiverId) {
        setMessages(prev => [...prev, newMsg]);
      }
    }

    alert("Message forwarded successfully.");
  } catch (err) {
    console.error("Forward failed:", err);
    alert("Forwarding failed.");
  } finally {
    setIsForwarding(false);
  }
};

// Remove chat PIN
const handleRemovePinClick = async () => {
  try {
    setLoading(true);
    await apiFetch("/remove-chat-pin", {
      method: "POST",
      body: JSON.stringify({ userId: loggedUser.userid }),
    });

    setMessage("✅ Chat lock removed successfully");
    if (onRemovePin) onRemovePin();
  } catch (err) {
    setMessage("❌ " + (err.message || "Error removing chat lock"));
  } finally {
    setLoading(false);
  }
};

 

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io('https://mygram-1-1nua.onrender.com');
    }
  }, []);

 const handleLock = () => {
    onLock(); // Lock the chats
    localStorage.setItem("chatUnlocked", "false");
  };

 

  const triggerForwardMode = (msg) => {
    setIsForwarding(true);
    setMessageToForward(msg);
    
  };

 

  return (
    <div className="chat-container">
  {/* Sidebar */}
  <div className={`sidebar ${selectedUser ? "hide-mobile" : ""}`}>
    <ChatSidebar
      onSelectUser={(user) => {
        if (!isForwarding) {
          setSelectedUser(user);
        }
      }}
      selectedUserId={selectedUser?._id}
      isForwarding={isForwarding}
      onSelectForwardUser={(userIds) => {
        if (userIds.length === 0) {
          setIsForwarding(false);
          setMessageToForward(null);
        } else {
          forwardMessageToUsers(messageToForward, userIds);
        }
      }}
    />
  </div>

  {/* Chat Window */}
  <div className={`chat-window ${!selectedUser ? "hide-mobile" : ""}`}>
    {selectedUser && (
      <ChatWindow
        selectedUser={selectedUser}
        chatList={chatList}
        messages={messages}
        setMessages={setMessages}
        socket={socketRef.current}
        triggerForwardMode={triggerForwardMode}
        onBack={() => setSelectedUser(null)} // 👈 important for mobile back button
      />
    )}
  </div>

  {/* Chat Actions (keep global, always visible) */}
  <div className="chat-actions">
    <button onClick={onLock} style={{ padding: "5px 10px" }}>
      🔒 Lock Chats
    </button>

    {canRemovePin && (
      <button onClick={handleRemovePinClick}>
        ❌ Remove Chat Lock
      </button>
    )}
  </div>

  {message && <p>{message}</p>}

  <ToastContainer position="bottom-right" autoClose={3000} />
</div>

  );
};

export default Chat;