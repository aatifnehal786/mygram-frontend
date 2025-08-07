// ✅ Chat.js
import React, { useState, useEffect, useRef } from 'react';
import ChatSidebar from './ChatSideBar';
import ChatWindow from './ChatWindow';
import io from 'socket.io-client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './chat.css';

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(
    JSON.parse(localStorage.getItem('selected-chat-user')) || null
  );
  const [chatList, setChatList] = useState([]);
  const [messages, setMessages] = useState([]);
 
  const [loggedUser, setLoggedUser] = useState(
    JSON.parse(sessionStorage.getItem('token-auth'))
  );
  const [isForwarding, setIsForwarding] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);


  const socketRef = useRef(null);
  

 

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io('https://mygram-1-1nua.onrender.com');
    }
  }, []);

useEffect(() => {
  if (!selectedUser || !loggedUser?.token) return;

  fetch(`https://mygram-1-1nua.onrender.com/chat/${selectedUser._id}`, {
    headers: { Authorization: `Bearer ${loggedUser.token}` },
  })
    .then(res => res.ok ? res.json() : [])
    .then(data => setMessages(data || []))
    .catch(err => console.error('Fetch chat error:', err));

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

  // ✅ Cleanup listener on component unmount or when selectedUser changes
  return () => {
    socketRef.current.off('receiveMessage', handleReceiveMessage);
  };
}, [selectedUser]);




  const triggerForwardMode = (msg) => {
    setIsForwarding(true);
    setMessageToForward(msg);
    
  };

 const forwardMessageToUsers = async (msg, receiverIds) => {
  const receivers = Array.isArray(receiverIds) ? receiverIds : [receiverIds];

  setIsForwarding(true);

  try {
    for (const receiverId of receivers) {
      if (receiverId === loggedUser.userid) continue;

      const res = await fetch("https://mygram-1-1nua.onrender.com/chat/forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: loggedUser.userid,
          receiverId,
          message: msg.message || '',
          fileUrl: msg.fileUrl || null,
          fileType: msg.fileType || null,
          isForwarded: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error(`Forward to ${receiverId} failed:`, err);
        continue;
      }

      const newMsg = await res.json();
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






  return (
    <div className="chat-container">
     
      
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

      

        {  selectedUser && (
        
          
            <ChatWindow
              selectedUser={selectedUser}
              chatList={chatList}
              messages={messages}
              setMessages={setMessages}
              socket={socketRef.current}
              triggerForwardMode={triggerForwardMode}
            />

           
        
        )}
      

  


      <ToastContainer position="bottom-right" autoClose={3000} />
     
       
    </div>
  );
};

export default Chat;