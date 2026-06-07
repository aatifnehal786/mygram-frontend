import React, { createContext, useEffect, useContext, useState } from "react";
import { io } from "socket.io-client";
import { UserContext } from "./UserContext";

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket,setSocket] = useState()
  const { loggedUser } = useContext(UserContext);
 

  useEffect(() => {
    

    const newSocket = io("https://mygram-mvc.onrender.com", {
  transports: ["polling", "websocket"],
  withCredentials: true,
});
setSocket(newSocket)
    
   

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    return () => {
      socket.disconnect();
      
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !loggedUser?.userid) return;

    socket.emit("join", loggedUser.userid);
    console.log("🟢 Joined socket room:", loggedUser.userid);
  }, [loggedUser]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};