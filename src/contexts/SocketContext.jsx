import React, { createContext, useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { notificationReceived } from "../redux/slices/notificationSlice";
import { useSelector } from "react-redux";
import { UserContext } from "./UserContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notificationhandle,setNotificationHandle] = useState(false)
  const dispatch = useDispatch();
  const activeChatUserId = useSelector(state => state.chat.activeChatUserId);
  const {loggedUser} = useContext(UserContext)

  // 🔹 Create socket connection ONCE
  useEffect(() => {
    const newSocket = io("http://localhost:8000", {
      transports: ["websocket"],
      withCredentials: true
    });

    setSocket(newSocket);

    // 🔥 JOIN USER ROOM IMMEDIATELY
     

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(()=>{
    setNotificationHandle(true)
  },[socket])

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
  }, [socket, dispatch,notificationhandle]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
