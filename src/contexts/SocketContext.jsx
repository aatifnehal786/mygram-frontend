import { createContext, useEffect, useContext, useRef } from "react";
import { io } from "socket.io-client";
import { UserContext } from "./UserContext";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { loggedUser } = useContext(UserContext);

  useEffect(() => {
    const socket = io("https://mygram-mvc.onrender.com", {
      transports: ["polling", "websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current || !loggedUser?.userid) return;

    socketRef.current.emit("join", loggedUser.userid);
    console.log("🟢 Joined socket room:", loggedUser.userid);
  }, [loggedUser]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};