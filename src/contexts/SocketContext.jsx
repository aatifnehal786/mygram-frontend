import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  // Add other shared states here if needed (e.g., online users list)

  useEffect(() => {
    const newSocket = io("https://mygram-mvc.onrender.com"); // Replace with your backend URL
    setSocket(newSocket);

    // Clean up on unmount
    return () => newSocket.close();
  }, []);

  // Place the global notification listener here
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = ({ senderId, text }) => {
      console.log("Global notification received!");
      
      // Update global notification list (optional, maybe just counts is enough)
      // setNotifications(prev => [...prev, { senderId, text, isRead: false }]);

      // Increase unread count (This is what you need)
      setUnreadCounts(prev => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1
      }));

      // Show browser notification if needed
      if (Notification.permission === "granted") {
        new Notification("New message", { body: text || "You have a new message" });
      }
    };

    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, [socket]); // Dependency on socket instance

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCounts, setUnreadCounts }}>
      {children}
    </SocketContext.Provider>
  );
};
