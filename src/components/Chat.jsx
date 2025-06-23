import React, { useState, useEffect, useRef } from 'react';
import ChatSidebar from './ChatSideBar';
import ChatWindow from './ChatWindow';
import io from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './chat.css';

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(
    JSON.parse(localStorage.getItem('selected-chat-user')) || null
  );
  const [chatList, setChatList] = useState([]);
  const [forwardToUser, setForwardToUser] = useState(null);
  const [isForwarding, setIsForwarding] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [view, setView] = useState('sidebar'); // 'sidebar' or 'chat'

  

  const [loggedUser, setLoggedUser] = useState(
    JSON.parse(sessionStorage.getItem('token-auth'))
  );

  console.log(loggedUser)

  useEffect(() => {
  if (!selectedUser || !loggedUser?.token) return;

  fetch(`https://mygram-1-1nua.onrender.com/chat/${selectedUser._id}`, {
    headers: { Authorization: `Bearer ${loggedUser.token}` },
  })
    .then((res) => res.ok ? res.json() : [])
    .then((data) => setMessages(data || []))
    .catch((err) => console.error('Fetch chat error:', err));
}, [selectedUser, loggedUser]);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io('https://mygram-1-1nua.onrender.com');
    }
  }, []);

  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem('selected-chat-user', JSON.stringify(selectedUser));
    }
  }, [selectedUser]);

  const handleSelectForwardUser = async (user) => {
    if (!messageToForward || !socketRef.current) return;

    const fullMessage = {
      senderId: loggedUser?.userid,
      receiverId: user._id,
      createdAt: new Date().toISOString(),
      isForwarded: true,
      ...(messageToForward.message && { message: messageToForward.message }),
      ...(messageToForward.fileUrl && {
        fileUrl: messageToForward.fileUrl,
        fileType: messageToForward.fileType,
      }),
    };

    try {
     const res = await fetch('https://mygram-1-1nua.onrender.com/chat/forward', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json'  },
  
  body: JSON.stringify(fullMessage),
});

const responseBody = await res.json();
console.log("🔍 Response:", res.status, responseBody);

if (res.ok) {
  socketRef.current.emit('sendMessage', responseBody);
  if (user._id === selectedUser?._id) {
    setMessages((prev) => [...prev, responseBody]);
  }
  toast.success(`Message forwarded to ${user.username}`);
} else {
  toast.error('Failed to forward message.');
}

    } catch (err) {
      console.error('Forward message error:', err);
      toast.error('Something went wrong while forwarding.');
    }

    setForwardToUser(null);
    setIsForwarding(false);
    setMessageToForward(null);
  };

  return (
   <div className="chat-layout">

  {/* Toggle Button */}
  {selectedUser && view === 'chat' && (
    <button className="toggle-btn" onClick={() => setView('sidebar')}>
      ← Back
    </button>
  )}

  {/* Show Sidebar */}
  {(view === 'sidebar' || !selectedUser) && (
    <ChatSidebar
      className='chat-container'
      onSelectUser={(user) => {
        setSelectedUser(user);
        if (window.innerWidth < 768) setView('chat'); // auto switch on small screen
      }}
      selectedUserId={selectedUser?._id}
      onSelectForwardUser={handleSelectForwardUser}
      isForwarding={isForwarding}
      loggedUser={loggedUser}
      showFollowedUsersOnly={true}
      setChatList={setChatList}
    />
  )}

  {/* Show Chat Window */}
  {selectedUser && view === 'chat' && (
    <ChatWindow
      selectedUser={selectedUser}
      chatList={chatList}
      messages={messages}
      setMessages={setMessages}
      triggerForwardMode={(msg) => {
        setIsForwarding(true);
        setMessageToForward(msg);
      }}
      socket={socketRef.current}
    />
  )}

  <ToastContainer position="bottom-right" autoClose={3000} />
</div>

  );
};

export default Chat;
