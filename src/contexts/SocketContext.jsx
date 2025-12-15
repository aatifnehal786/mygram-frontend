import { createContext, useContext, useEffect, useRef } from "react";
import io from "socket.io-client";
import { UserContext } from "./UserContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { loggedUser } = useContext(UserContext);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!loggedUser?.userid || socketRef.current) return;

    const socket = io("https://mygram-mvc.onrender.com");

    socket.on("connect", () => {
      socket.emit("join", loggedUser.userid);
    });

    socketRef.current = socket;

    return () => socket.disconnect();
  }, [loggedUser?.userid]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
