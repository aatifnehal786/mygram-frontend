import { io } from "socket.io-client";
import useUserStore from "../store/useUserStore";
import usePresenceStore from "../store/usePresenceStore";

let socket = null;

export const initializeSocket = () => {
  if (socket) return socket;
  const user = useUserStore.getState().loggedUser;
  if (!user?.userid) return null;

  const BACKEND_URL = "https://mygram-mvc.onrender.com";

  socket = io(BACKEND_URL, {
    withCredentials: true,
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    socket.emit("join", user?.userid);
    socket.emit("get-online-users");
  });

  // LIVE PRESENCE LISTENERS - put here so it works even before Layout mounts
  socket.on("online-users", (users) => {
    usePresenceStore.getState().setOnlineUsers(users);
  });
  socket.on("online-users-list", (users) => {
    usePresenceStore.getState().setOnlineUsers(users);
  });
  socket.on("user-online", ({ userId }) => {
    usePresenceStore.getState().addOnlineUser(userId);
  });
  socket.on("user-offline", ({ userId }) => {
    usePresenceStore.getState().removeOnlineUser(userId);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) return initializeSocket();
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};