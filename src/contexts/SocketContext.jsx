import { io } from "socket.io-client";
import useUserStore from "../store/useUserStore";

let socket = null;
// const token = localStorage.getItem("auth_token");


export const initializeSocket = () => {
  if (socket) return socket;

  const user = useUserStore.getState((state) => state.loggedUser);
  
  if (!user?._id) return null;

  const BACKEND_URL = "https://mygram-mvc.onrender.com"

  socket = io(BACKEND_URL, {
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    // 🚫 DO NOT force transports
  });

  // Connection events
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    socket.emit("join", user._id);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
