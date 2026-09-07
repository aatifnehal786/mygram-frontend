import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import useUserStore from "../store/useUserStore";
import usePresenceStore from "../store/usePresenceStore";

const SocketContext = createContext(null);
let socket = null;
const BACKEND_URL = "https://mygram-mvc.onrender.com";

export const SocketProvider = ({ children }) => {
  const [socketInstance, setSocketInstance] = useState(null);
  const loggedUser = useUserStore((s) => s.loggedUser);

  useEffect(() => {
    // Support both _id and id
    const myId = loggedUser?._id?.toString() || loggedUser?.id?.toString() || loggedUser?.userid?.toString();
    
    if (!myId) {
      console.log("SocketContext: waiting... loggedUser:", loggedUser);
      return;
    }

    if (socket?.connected && socket.userId === myId) {
      setSocketInstance(socket);
      return;
    }

    if (socket) socket.disconnect();

    console.log("Connecting socket for:", myId);
    socket = io(BACKEND_URL, {
      withCredentials: true,
      transports: ["polling", "websocket"],
    });

    socket.userId = myId;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("join", myId);
    });

    socket.on("online-users", (users) => {
      console.log("Online users received:", users);
      usePresenceStore.getState().setOnlineUsers(users);
    });
    socket.on("user-online", ({ userId }) => usePresenceStore.getState().addOnlineUser(userId));
    socket.on("user-offline", ({ userId }) => usePresenceStore.getState().removeOnlineUser(userId));

    setSocketInstance(socket);
  }, [loggedUser?.userid]); // watch both

  return (
    <SocketContext.Provider value={socketInstance}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export const getSocket = () => socket;
export const initializeSocket = () => socket;
export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};