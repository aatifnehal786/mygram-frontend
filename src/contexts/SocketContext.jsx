import { createContext, useEffect, useContext, useState } from "react";
import { io } from "socket.io-client";
import { UserContext } from "./UserContext";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { loggedUser } = useContext(UserContext);

  useEffect(() => {
    const newSocket = io("https://mygram-mvc.onrender.com", {
      transports: ["websocket"],
      withCredentials: true,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
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
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};