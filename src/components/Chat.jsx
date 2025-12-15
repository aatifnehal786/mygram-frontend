// ✅ Chat.js
import React, { useState, useEffect, useRef } from 'react';
import ChatSidebar from './ChatSideBar';
import ChatWindow from './ChatWindow';
import io from 'socket.io-client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiFetch } from '../api/apiFetch';
import './chat.css';
import { useSocket } from '../contexts/SocketContext';

const Chat = ({onLock, canRemovePin, onRemovePin }) => {
  const [selectedUser, setSelectedUser] = useState(
    JSON.parse(localStorage.getItem('selected-chat-user')) || null
  );
   const { setUnreadCounts, socket,unreadCounts} = useSocket();
  const [chatList, setChatList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
 
  const [loggedUser, setLoggedUser] = useState(
    JSON.parse(localStorage.getItem('token-auth'))
  );
  const [isForwarding, setIsForwarding] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
 
 



 





  
useEffect(() => {
  if (!selectedUser || !loggedUser?.token) return;

  // Clear existing messages when switching users
  setMessages([]);

  const fetchChat = async () => {
    try {
      const data = await apiFetch(`api/chats/chat/${selectedUser._id}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch chat error:", err);
      setMessages([]);
    }
  };

  fetchChat();

  // JOIN SOCKET ROOM
  if (socket && loggedUser?.userid) {
    socket.emit("join",  loggedUser.userid );
  }

  const handleReceiveMessage = (msg) => {
    const senderId = msg.sender?._id || msg.sender;
    const receiverId = msg.receiver?._id || msg.receiver;

    const isCurrentChat =
      (senderId === loggedUser.userid && receiverId === selectedUser._id) ||
      (receiverId === loggedUser.userid && senderId === selectedUser._id);

    if (isCurrentChat) {
      setMessages((prev) => [...prev, msg]);
    }
  };

  if (socket) {
    socket.on("receiveMessage", handleReceiveMessage);
  }

  return () => {
    if (socket) socket.off("receiveMessage", handleReceiveMessage);
  };
}, [selectedUser, loggedUser, socket]);



// Forward message to multiple users
const forwardMessageToUsers = async (msg, receiverIds) => {
  const receivers = Array.isArray(receiverIds) ? receiverIds : [receiverIds];
  setIsForwarding(true);

  try {
    for (const receiverId of receivers) {
      if (receiverId === loggedUser.userid) continue;

      const newMsg = await apiFetch("api/chats/chat/forward", {
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

      socket?.emit("sendMessage", newMsg);

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

  const triggerForwardMode = (msg) => {
    setIsForwarding(true);
    setMessageToForward(msg);
    
  };

  

 

  return (
    <div className="chat-container">
  {/* Sidebar */}
  <div className={`sidebar ${selectedUser ? "hide-on-mobile" : ""}`} >
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
  <div className={`chat-window ${selectedUser ? "show-on-mobile" : ""}`}>
    {selectedUser && (
      <ChatWindow
        selectedUser={selectedUser}
        chatList={chatList}
        messages={messages}
        setMessages={setMessages}
        triggerForwardMode={triggerForwardMode}
        onBack={() => setSelectedUser(null)} // 👈 important for mobile back button
      />
    )}
  </div>



  {message && <p>{message}</p>}

  <ToastContainer position="bottom-right" autoClose={3000} />
</div>

  );
};

export default Chat;