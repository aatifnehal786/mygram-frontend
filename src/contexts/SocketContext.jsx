import { io } from "socket.io-client";
import useUserStore from "../store/useUserStore";
import usePresenceStore from "../store/usePresenceStore";

let socket = null;

export const initializeSocket = () => {
  const user = useUserStore.getState().loggedUser;
  const myId = user?._id?.toString(); // FIXED HERE
  if (!myId) {
    console.log("No logged user for socket");
    return null;
  }
  if (socket?.connected && socket.userId === myId) return socket;
  
  if(socket) socket.disconnect();

  const BACKEND_URL = "https://mygram-mvc.onrender.com";
  console.log("Connecting socket for:", myId);

  socket = io(BACKEND_URL, {
    withCredentials: true,
    transports: ["polling", "websocket"], // polling first for Render.com
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

  socket.on("user-online", ({ userId }) => {
    console.log("User came online:", userId);
    usePresenceStore.getState().addOnlineUser(userId);
  });

  socket.on("user-offline", ({ userId }) => {
    console.log("User went offline:", userId);
    usePresenceStore.getState().removeOnlineUser(userId);
  });

  socket.on("connect_error", (err) => console.log("Socket error:", err.message));

  return socket;
};

export const getSocket = () => socket || initializeSocket();
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    usePresenceStore.getState().setOnlineUsers([]);
  }
};