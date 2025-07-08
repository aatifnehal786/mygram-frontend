import React, { useState, useEffect, useRef } from 'react';
import ChatSidebar from './ChatSideBar';
import ChatWindow from './ChatWindow';
import io from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './chat.css';


const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [view, setView] = useState(window.innerWidth < 768 ? 'sidebar' : 'full');
  const [loggedUser, setLoggedUser] = useState(
    JSON.parse(sessionStorage.getItem('token-auth'))
  );

  const [messageToForward, setMessageToForward] = useState(null);
  const [isForwardMode, setIsForwardMode] = useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setView('full');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      const isChatWithSelectedUser =
        (msg.sender === loggedUser.userid && msg.receiver === selectedUser._id) ||
        (msg.receiver === loggedUser.userid && msg.sender === selectedUser._id);
      if (isChatWithSelectedUser) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      socketRef.current.off('receiveMessage');
    };
  }, [selectedUser]);

  const triggerForwardMode = (msg) => {
    setMessageToForward(msg);
    setIsForwardMode(true);
    toast.info("Select a follower to forward this message");
  };

  const forwardMessageToUser = async (targetUser) => {
    if (!messageToForward || !loggedUser) return;

    try {
      const res = await fetch("https://mygram-1-1nua.onrender.com/chat/forward", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loggedUser.token}`,
        },
        body: JSON.stringify({
          senderId: loggedUser.userid,
          receiverId: targetUser._id,
          message: messageToForward.message,
          fileUrl: messageToForward.fileUrl,
          fileType: messageToForward.fileType,
          isForwarded: true,
        }),
      });

      const newMessage = await res.json();

      if (res.ok) {
        socketRef.current.emit("sendMessage", newMessage);
        setMessages(prev => [...prev, newMessage]);
        toast.success("Message forwarded!");
      } else {
        toast.error("Forward failed");
      }
    } catch (err) {
      console.error("Forward error:", err);
      toast.error("Error forwarding message");
    }

    setIsForwardMode(false);
    setMessageToForward(null);
  };

  return (
    <div className="chat-layout">
      <div className="chat-grid">
        {(view === 'sidebar' || view === 'full') && (
          <ChatSidebar
            onSelectUser={(user) => {
              setSelectedUser(user);
              if (window.innerWidth < 768) setView('chat');
            }}
            selectedUserId={selectedUser?._id}
            isForwarding={isForwardMode}
            onSelectForwardUser={forwardMessageToUser}
          />
        )}

        {(view === 'chat' || view === 'full') && selectedUser && (
          <div className="chat-main">
            <div className="chat-header">
              <div className="chat-header-left">
                {window.innerWidth < 768 && (
                  <button className="toggle-btn" onClick={() => setView('sidebar')}>
                    ← Back
                  </button>
                )}
                <h3>{selectedUser.username}</h3>
              </div>
            </div>

            <ChatWindow
              selectedUser={selectedUser}
              messages={messages}
              setMessages={setMessages}
              socket={socketRef.current}
              triggerForwardMode={triggerForwardMode}
            />
          </div>
        )}
      </div>

      {isForwardMode && (
        <div className="forward-banner">
          <p>Forwarding: {messageToForward?.message || '[Media]'}</p>
          <button onClick={() => {
            setIsForwardMode(false);
            setMessageToForward(null);
          }}>Cancel</button>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default Chat;
