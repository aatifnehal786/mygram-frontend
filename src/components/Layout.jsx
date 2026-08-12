import { Outlet, Link, useLocation } from "react-router-dom";
import { FaHome, FaPlusSquare, FaRegHeart, FaRegPaperPlane } from "react-icons/fa";
import { useEffect } from "react";
import Header from "./Header";
import { useTheme } from "../contexts/ThemeContext";
import { getSocket } from "../contexts/SocketContext";
import useUserStore from "../store/useUserStore";
import usePresenceStore from "../store/usePresenceStore";
import VideoCallManager from "./VideoCallManager";

export default function Layout() {
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

  return (
    <div className={`min-h-screen ${theme === "dark"? "bg-black text-white" : "bg-white text-black"}`}>

      {/* SIDEBAR DESKTOP - FIXED WIDTH 245px */}
      <aside className={`hidden md:flex fixed top-0 left-0 h-screen w- border-r flex-col p-3 z-30 ${theme === "dark"? "bg-black border-zinc-800" : "bg-white border-gray-200"}`}>
        <Link to="/home" className="text- px-3 py-6 font-bold" style={{ fontFamily: 'cursive' }}>MyGram</Link>
        <nav className="flex flex-col gap-1 flex-1">
          <Link to="/home" className={`flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 ${isActive("/home")? "font-bold" : ""}`}><FaHome className="text-" /> Home</Link>
          <Link to="/chat" className={`flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 ${isActive("/chat")? "font-bold" : ""}`}><FaRegPaperPlane className="text-" /> Messages</Link>
          <Link to="/createpost" className={`flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 ${isActive("/createpost")? "font-bold" : ""}`}><FaPlusSquare className="text-" /> Create</Link>
          {/* <Link to="/getdevices" className={`flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800`}><FaRegHeart className="text-" /> Notifications</Link> */}
          <Link to="/profile" className={`flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800`}><img src={myPic} className="w-6 h-6 rounded-full object-cover" /> Profile</Link>
        </nav>
        <button onClick={toggleTheme} className="p-3 text-left text-sm">{theme === "dark"? "☀ Light mode" : "🌙 Dark mode"}</button>
      </aside>

      {/* MAIN WRAPPER - PADDING 245px LEFT SO CONTENT NOT HIDDEN */}
      <div className="w-full min-h-screen flex flex-col md:pl-64">

        {/* HEADER - VISIBLE ON BOTH DESKTOP + MOBILE NOW */}
        <div className={`sticky top-0 z-20 border-b ${theme === "dark"? "bg-black border-zinc-800" : "bg-white border-gray-200"}`}>
          <Header />
        </div>

        {/* CONTENT - CENTERED */}
        <main className={`w-full min-h-screen ${isChat? "max-w-full" : "max-w- mx-auto w-full"}`}>
          {/* Extra padding like Instagram */}
          <div className={`${isChat? "" : "px-0 md:px-8"}`}>
            <Outlet />
          </div>
        </main>

        {/* MOBILE BOTTOM NAV */}
        <div className={`md:hidden fixed bottom-0 left-0 w-full border-t flex justify-around py-3 z-30 ${theme === "dark"? "bg-black border-zinc-800" : "bg-white border-gray-200"}`}>
          <Link to="/home"><FaHome className="text-xl" /></Link>
          <Link to="/chat"><FaRegPaperPlane className="text-xl" /></Link>
          <Link to="/createpost"><FaPlusSquare className="text-xl" /></Link>
          <Link to="/profile"><img src={myPic} className="w-6 h-6 rounded-full" /></Link>
        </div>
      </div>

      <VideoCallManager />
    </div>
  );
}