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

    socketRef.current.on('receiveMessage', (msg) => {
      const isCurrentChat =
        (msg.sender === loggedUser.userid && msg.receiver === selectedUser._id) ||
        (msg.receiver === loggedUser.userid && msg.sender === selectedUser._id);
      if (isCurrentChat) setMessages(prev => [...prev, msg]);
    });

   

    
  }, [selectedUser]);



  const triggerForwardMode = (msg) => {
    setIsForwarding(true);
    setMessageToForward(msg);
    
  };

  const forwardMessageToUser = async (msg, receiverId) => {
    try {
      const res = await fetch("https://mygram-1-1nua.onrender.com/chat/forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: loggedUser.userid,
          receiverId,
          message: msg.message || '',
          fileUrl: msg.fileUrl || null,
          fileType: msg.fileType || null,
          isForwarded: true
        })
      });

      const newMsg = await res.json();
      socketRef.current?.emit("sendMessage", newMsg);

      if (selectedUser?._id === receiverId) {
        setMessages(prev => [...prev, newMsg]);
      }

      setIsForwarding(false);
     
    } catch (err) {
      console.error("Forward failed:", err);
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
            onSelectForwardUser={(user) => forwardMessageToUser(messageToForward, user._id)}
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