import { useEffect, useContext } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useNotification } from "../contexts/NotificationContext";
import { UserContext } from "../contexts/UserContext";

const GlobalNotifications = () => {
  const socket = useSocket();
  const { addUnread } = useNotification();
  const { loggedUser } = useContext(UserContext);

  useEffect(() => {
    if (!socket) return;

    const handler = (msg) => {
      const senderId = msg.sender?._id || msg.sender;

      // 🔴 increase unread count
      addUnread(senderId);

      // 🔔 browser notification
      if (Notification.permission === "granted") {
        new Notification("New Message", {
          body: msg.message || "New message received"
        });
      }
    };

    socket.on("receiveMessage", handler);

    return () => socket.off("receiveMessage", handler);
  }, [socket]);

  return null;
};

export default GlobalNotifications;
