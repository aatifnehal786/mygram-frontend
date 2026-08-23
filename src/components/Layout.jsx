import { Outlet, Link, useLocation } from "react-router-dom";
import { FaHome, FaPlusSquare, FaRegHeart, FaRegPaperPlane } from "react-icons/fa";
import { useEffect, useState } from "react";
import Header from "./Header";
import { useTheme } from "../contexts/ThemeContext";
import { getSocket } from "../contexts/SocketContext";
import useUserStore from "../store/useUserStore";
import usePresenceStore from "../store/usePresenceStore";
import VideoCallManager from "./VideoCallManager";

export default function Layout() {
  const [rateLimitError, setRateLimitError] = useState('');
  const { theme, toggleTheme } = useTheme();
  const socket = getSocket();
  const loggedUser = useUserStore((s) => s.loggedUser);
  const { setOnlineUsers, addOnlineUser, removeOnlineUser } = usePresenceStore();
  const location = useLocation();
  const myPic = loggedUser?.profilePic || "/placeholder.svg";
  const isActive = (path) => location.pathname === path;
  const isChat = location.pathname.startsWith("/chat");

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

  useEffect(() => {
    const handleRateLimit = (e) => {
      setRateLimitError(e.detail);
      setTimeout(() => setRateLimitError(''), 4000); // hide after 4 sec
    };
    window.addEventListener('rate-limit-error', handleRateLimit);
    return () => window.removeEventListener('rate-limit-error', handleRateLimit);
  }, []);

  return (
    <div className={`min-h-screen ${theme === "dark"? "bg-black text-white" : "bg-white text-black"}`}>
      {/* GLOBAL RATE LIMIT TOAST */}
      {rateLimitError && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-6 py-3 rounded-full shadow-lg animate-bounce flex items-center gap-2">
          <span>🚨</span> {rateLimitError}
        </div>
      )}

      {/* SIDEBAR DESKTOP - FIXED WIDTH 245px */}
      <aside className={`hidden md:flex fixed top-0 left-0 h-screen w-64 border-r flex-col p-3 z-30 ${theme === "dark"? "bg-black border-zinc-800" : "bg-white border-gray-200"}`}>
        <Link to="/home" className={`${theme === "dark" ? "text-white" : "text-black"} text-xl px-3 py-6 font-bold`} style={{ fontFamily: 'cursive' }}>MyGram</Link>
        <nav className="flex flex-col gap-1 flex-1">
          <Link to="/home" className={`${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100 text-black br-gray-200"} flex items-center gap-4 p-3 rounded-lg ${isActive("/home")? "font-bold" : ""}`}><FaHome className="text-xl" /> Home</Link>
          <Link to="/chat" className={`${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100 text-black br-gray-200"} flex items-center gap-4 p-3 rounded-lg ${isActive("/chat")? "font-bold" : ""}`}><FaRegPaperPlane className="text-xl" /> Messages</Link>
          <Link to="/createpost" className={`${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100 text-black br-gray-200"} flex items-center gap-4 p-3 rounded-lg ${isActive("/createpost")? "font-bold" : ""}`}><FaPlusSquare className="text-xl" /> Create</Link>
          <Link to="/profile" className={`${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100 text-black br-gray-200"} flex items-center gap-4 p-3 rounded-lg`}><img src={myPic} className="w-6 h-6 rounded-full object-cover" /> Profile</Link>
        </nav>
        {/* DESKTOP THEME BUTTON */}
        <button onClick={toggleTheme} className="p-3 text-left text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 w-full">
          {theme === "dark"? "☀ Light mode" : "🌙 Dark mode"}
        </button>
      </aside>

      {/* MOBILE THEME BUTTON - FLOATING VISIBLE */}
      <button 
        onClick={toggleTheme} 
        className="md:hidden fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-white dark:bg-zinc-800 border shadow-lg flex items-center justify-center text-xl"
      >
        {theme === "dark" ? "☀" : "🌙"}
      </button>

      {/* MAIN WRAPPER */}
      <div className="w-full min-h-screen flex flex-col md:pl-64">
        <div className={`sticky top-0 z-20 border-b ${theme === "dark"? "bg-black border-zinc-800" : "bg-white border-gray-200"}`}>
          <Header />
        </div>
        <main className={`w-full min-h-screen ${isChat? "max-w-full" : "max-w-3xl mx-auto w-full"}`}>
          <div className={`${isChat? "" : "px-0 md:px-8"}`}>
            <Outlet />
          </div>
        </main>

        {/* MOBILE BOTTOM NAV */}
        <div className={`md:hidden fixed bottom-0 left-0 w-full border-t flex justify-around py-3 z-30 ${theme === "dark"? "bg-black border-zinc-800" : "bg-white border-gray-200"}`}>
          <Link to="/home" className={`${theme === "dark" ? "text-white" : "text-black"}`}>
            <FaHome className="text-xl" />
          </Link>
          <Link to="/chat" className={`${theme === "dark" ? "text-white" : "text-black"}`}>
            <FaRegPaperPlane className="text-xl" />
          </Link>
          <Link to="/createpost" className={`${theme === "dark" ? "text-white" : "text-black"}`}>
            <FaPlusSquare className="text-xl" />
          </Link>
          <Link to="/profile" className={`${theme === "dark" ? "text-white" : "text-black"}`}>
            <img src={myPic} className="w-6 h-6 rounded-full" />
          </Link>
        </div>
      </div>

      <VideoCallManager />
    </div>
);
}