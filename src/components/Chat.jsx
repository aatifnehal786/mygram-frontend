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

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(null);
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

 if (loggedUser?.userid) {
        socket.emit("join", loggedUser.userid);
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
    setSelectedUser(null)
    setMessageToForward(msg);
    
  };

  

 

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
  {/* Sidebar */}
  <div
    className={`
      w-full md:w-1/3 lg:w-1/4
      bg-white border-r
      transition-all duration-300
      ${selectedUser ? "hidden md:block" : "block"}
    `}
  >
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
  {/* Chat Window */}
<div
  className={`
    w-full h-full
    md:flex-1
    bg-gray-50
    transition-all duration-300
    ${selectedUser ? "block" : "hidden md:flex"}
  `}
>

    {selectedUser ? (
      <ChatWindow
        selectedUser={selectedUser}
        chatList={chatList}
        messages={messages}
        setMessages={setMessages}
        triggerForwardMode={triggerForwardMode}
        onBack={() => setSelectedUser(null)} // mobile back
      />
    ) : (
      <div className="hidden md:flex h-full items-center justify-center text-gray-400">
        Select a chat to start messaging
      </div>
    )}
  </div>

  {/* Toast */}
  <ToastContainer position="bottom-right" autoClose={3000} />

  {/* Optional message */}
  {message && (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-md shadow">
      {message}
    </div>
  )}
</div>


  );
};

export default Chat;