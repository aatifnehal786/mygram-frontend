import React, { createContext, useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { notificationReceived } from "../redux/slices/notificationSlice";
import { useSelector } from "react-redux";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const dispatch = useDispatch();
  const activeChatUserId = useSelector(
  state => state.chat.activeChatUserId
);

  // 🔹 Create socket connection ONCE
  useEffect(() => {
    const newSocket = io("https://mygram-mvc.onrender.com", {
      transports: ["websocket"],
      withCredentials: true
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 🔹 Global notification listener (Redux-driven)
  useEffect(() => {
    if (!socket) return;

   const handleNewNotification = ({ senderId, text }) => {

  // 🚫 Do NOT notify if user is actively chatting with sender
  if (activeChatUserId === senderId) return;

  dispatch(notificationReceived(senderId));

  if (Notification.permission === "granted") {
    const n = new Notification("New message", {
      body: text || "You have a new message"
    });
    n.onclick = () => window.focus();
  }
};


    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, [socket, dispatch]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
