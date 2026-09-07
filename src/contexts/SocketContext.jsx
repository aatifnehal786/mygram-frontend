import { io } from "socket.io-client";
import useUserStore from "../store/useUserStore";
import usePresenceStore from "../store/usePresenceStore";

let socket = null;

export const initializeSocket = () => {
  if (socket?.connected) return socket;
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const user = useUserStore.getState().loggedUser;
  const myId = user?._id || user?.id; // FIX: _id not userid
  if (!myId) return null;

  const BACKEND_URL = "https://mygram-mvc.onrender.com";

  socket = io(BACKEND_URL, {
    withCredentials: true,
    autoConnect: true,
    transports: ["websocket", "polling"],
  });

  const { setOnlineUsers, addOnlineUser, removeOnlineUser } = usePresenceStore.getState();

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    socket.emit("join", myId.toString());
  });

  // Re-join on reconnect
  socket.on("reconnect", () => {
    socket.emit("join", myId.toString());
  });

  socket.on("online-users", (users) => setOnlineUsers(users));
  socket.on("user-online", ({ userId }) => addOnlineUser(userId));
  socket.on("user-offline", ({ userId }) => removeOnlineUser(userId));

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
    usePresenceStore.getState().setOnlineUsers([]);
  }
};