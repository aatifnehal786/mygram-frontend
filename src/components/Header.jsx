import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaHome, FaRegHeart, FaRegPaperPlane, FaSearch, FaPlusSquare } from "react-icons/fa";
import { RxCross1 } from "react-icons/rx";
import { useTheme } from "../contexts/ThemeContext";
import useUserStore from "../store/useUserStore";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const loggedUser = useUserStore(s => s.loggedUser);
  const logout = useUserStore(s => s.logout);
  const isGuest = loggedUser?.user?.isGuest;
  const myPic = loggedUser?.profilePic || loggedUser?.profilePicture || "/placeholder.svg";

  const isActive = (path) => location.pathname === path? "font-bold text-black dark:text-white" : "font-normal";

  function logOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      {/* MAIN HEADER - 60px */}
      <header className={`sticky top-0 z-30 w-full h- border-b ${theme==="dark"? "bg-black border-zinc-800 text-white" : "bg-white border-gray-200 text-black"}`}>
        <nav className="w-full max-w- mx-auto px-4 h-full flex items-center justify-between">

          {/* Logo */}
          <Link to="/home" className="text- font-bold tracking-wide" style={{ fontFamily: 'cursive' }}>
            MyGram
          </Link>

          {/* Center - Search (Desktop) */}
          <div className="hidden md:flex">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                placeholder="Search"
                className={`pl-9 pr-4 py-2 rounded-lg text-sm w- ${theme === "dark"? "bg-zinc-800" : "bg-gray-100"} focus:outline-none`}
                onFocus={() => setShowSearch(true)}
              />
            </div>
          </div>

          {/* Right Icons - Desktop */}
          <div className="hidden md:flex items-center gap-5 text-">
            <Link to="/home" className={isActive("/home")}><FaHome /></Link>
            <button onClick={() => setShowSearch(!showSearch)}><FaSearch /></button>
            <Link to="/createpost"><FaPlusSquare /></Link>
            <Link to="/chat"><FaRegPaperPlane /></Link>
            <Link to="/profile"><img src={myPic} className="w-7 h-7 rounded-full object-cover" /></Link>
             <button onClick={logOut} className="text-xs bg-red-500 text-white px-3 py-1 rounded">Logout</button>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-xl p-2">
            {menuOpen? <RxCross1 /> : <FaBars />}
          </button>
        </nav>
      </header>

      {/* MOBILE DROPDOWN - OUTSIDE header so not cut off */}
      {menuOpen && (
        <div className={`md:hidden fixed top- left-0 w-full z-40 border-b shadow-lg flex flex-col ${theme === "dark"? "bg-black border-zinc-800 text-white" : "bg-white border-gray-200 text-black"}`}>
          <Link to="/home" onClick={() => setMenuOpen(false)} className="px-6 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-3"><FaHome/> Home</Link>
          <Link to="/profile" onClick={() => setMenuOpen(false)} className="px-6 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-3"><img src={myPic} className="w-5 h-5 rounded-full"/> Profile</Link>
          <Link to="/createpost" onClick={() => setMenuOpen(false)} className="px-6 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-3"><FaPlusSquare/> Create</Link>
          <Link to="/chat" onClick={() => setMenuOpen(false)} className="px-6 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-3"><FaRegPaperPlane/> Messages</Link>
          <Link to="/getdevices" onClick={() => setMenuOpen(false)} className="px-6 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-3"><FaRegHeart/> Notifications</Link>
          <button onClick={logOut} className="px-6 py-3 text-left text-red-500 font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800">Log Out</button>
        </div>
      )}

      {/* Mobile Bottom Nav - Keep only if you don't have one in Layout.jsx */}
      {/* DELETE THIS if you already have bottom nav in Layout.jsx to avoid double nav */}
      <div className={`md:hidden fixed bottom-0 left-0 w-full border-t flex justify-around py-3 z-30 ${theme === "dark"? "bg-black border-zinc-800 text-white" : "bg-white border-gray-200 text-black"}`}>
        <Link to="/home"><FaHome className="text-xl" /></Link>
        <button onClick={() => setShowSearch(!showSearch)}><FaSearch className="text-xl" /></button>
        <Link to="/createpost"><FaPlusSquare className="text-xl" /></Link>
        <Link to="/chat"><FaRegPaperPlane className="text-xl" /></Link>
        <Link to="/profile"><img src={myPic} className="w-6 h-6 rounded-full object-cover" /></Link>
      </div>
    </>
  );
}