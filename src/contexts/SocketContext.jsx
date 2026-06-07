import React, { createContext, useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import { UserContext } from "./UserContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const {loggedUser} = useContext(UserContext)

  // 🔹 Create socket connection ONCE
  useEffect(() => {
    const newSocket = io("https://mygram-mvc.onrender.com", {
      transports: ["websocket","polling"],
      withCredentials: true
    });

    setSocket(newSocket);

    // 🔥 JOIN USER ROOM IMMEDIATELY
     newSocket.on("connect_error", (err) => {
  console.error("Socket connect error:", err.message);
});

newSocket.on("disconnect", (reason) => {
  console.warn("Socket disconnected:", reason);
});

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
  if (!socket || !loggedUser?.userid) return;

  socket.emit("join", loggedUser.userid);

  console.log("🟢 Joined socket room:", loggedUser.userid);

}, [socket, loggedUser]);





  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
