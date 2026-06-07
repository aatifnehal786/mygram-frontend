import React, { createContext, useEffect, useContext, useRef } from "react";
import { io } from "socket.io-client";
import { UserContext } from "./UserContext";

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { loggedUser } = useContext(UserContext);
 

  useEffect(() => {
    if (socketRef.current) return;

    const socket = io("https://mygram-mvc.onrender.com", {
      transports: ["polling", "websocket"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;
   

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current || !loggedUser?.userid) return;

    socketRef.current.emit("join", loggedUser.userid);
    console.log("🟢 Joined socket room:", loggedUser.userid);
  }, [loggedUser]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};