import { Outlet } from "react-router-dom";
import Header from "./Header";
import { useTheme } from "../contexts/ThemeContext";
import { useEffect } from "react";
import { getSocket } from "../contexts/SocketContext";
import useUserStore from "../store/useUserStore";
import usePresenceStore from "../store/usePresenceStore";
import VideoCallManager from "./VideoCallManager";

export default function Layout() {
  const { theme, toggleTheme } = useTheme();
  const socket = getSocket();
  const loggedUser = useUserStore(s => s.loggedUser);
  const { setOnlineUsers, addOnlineUser, removeOnlineUser } = usePresenceStore();

  useEffect(() => {
    if (!socket ||!loggedUser) return;
    const userId = loggedUser.userid || loggedUser._id;

    socket.emit("join", userId);
    socket.emit("get-online-users");

    const handleList = (users) => setOnlineUsers(users);
    const handleOnline = ({ userId }) => addOnlineUser(userId);
    const handleOffline = ({ userId }) => removeOnlineUser(userId);

    socket.on("online-users", handleList);
    socket.on("online-users-list", handleList);
    socket.on("user-online", handleOnline);
    socket.on("user-offline", handleOffline);

    return () => {
      socket.off("online-users", handleList);
      socket.off("online-users-list", handleList);
      socket.off("user-online", handleOnline);
      socket.off("user-offline", handleOffline);
    };
  }, [socket, loggedUser]);

  return (
    <div className={`min-h-screen flex flex-col ${theme === "dark"? "bg-black text-white" : "bg-gray-100 text-black"}`}>
      <Header />
      <button onClick={toggleTheme} className={`fixed top-2 right-12 px-2 py-2 rounded-full shadow-lg z-50 ${theme === "dark"? "bg-white text-black" : "bg-black text-white"}`}>
        {theme === "dark"? "☀ Light" : "🌙 Dark"}
      </button>
      <main className="flex-1 pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto"><Outlet /></div>
      </main>
      {/* ALWAYS MOUNTED - will ring even on Home/Profile */}
      <VideoCallManager />
    </div>
  );
}