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

  const isActive = (path) => location.pathname === path ? `${theme === "dark" ? "font-bold text-white" : "font-bold text-black"}` : `${theme === "dark" ? "font-bold text-white" : "font-bold text-black"}`;

  function logOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
  <>
  <header className={`sticky top-0 z-30 w-full h- border-b ${theme === "dark" ? "bg-[#202C33] border-[#374045] text-white" : "bg-[#075E54] border-[#075E54] text-white"}`}>
    <nav className="w-full max-w- mx-auto px-4 h-full flex items-center justify-between">

      {/* Logo - WhatsApp Style */}
      <Link to="/home" className="flex items-center gap-2">
        <div className="w-9 h-9 bg-[#25D366] rounded-full flex items-center justify-center text-white text- font-bold">✓</div>
        <span className="text- font-bold tracking-wide text-white">MyGram</span>
      </Link>

      {/* Center - Search (Desktop) - WhatsApp Pill Search */}
      <div className="hidden md:flex">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 text-sm" />
          <input
            placeholder="Search"
            className={`pl-9 pr-4 py-2 rounded-full text-sm w- placeholder:text-white/70 text-white ${theme === "dark" ? "bg-[#2A3942] focus:ring-2 focus:ring-[#25D366]/50" : "bg-white/20 focus:bg-white/30"} focus:outline-none transition`}
            onFocus={() => setShowSearch(true)}
          />
        </div>
      </div>

      {/* Right Icons - Desktop */}
      <div className="hidden md:flex items-center gap-5 text-white">
        {/* Uncomment these when you need them - already WhatsApp styled */}
        {/* <Link to="/home" className="text- hover:text-[#25D366]"><FaHome /></Link>
        <button onClick={() => setShowSearch(!showSearch)} className="text- hover:text-[#25D366]"><FaSearch /></button>
        <Link to="/createpost" className="text- hover:text-[#25D366]"><FaPlusSquare /></Link>
        <Link to="/chat" className="text- hover:text-[#25D366]"><FaRegPaperPlane /></Link>
        <Link to="/profile">
          <img src={myPic} className="w-8 h-8 rounded-full object-cover border-2 border-[#25D366]" />
        </Link> */}
        <button onClick={logOut} className="text-xs bg-[#25D366] hover:bg-[#1EBE5A] text-white px-4 py-2 rounded-full font-semibold transition">Logout</button>
      </div>

      {/* Mobile Menu Button */}
      <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-xl p-2 text-white">
        {menuOpen ? <RxCross1 /> : <FaBars />}
      </button>
    </nav>
  </header>

  {/* MOBILE DROPDOWN - WhatsApp Style */}
  {menuOpen && (
    <div className={`md:hidden fixed top- left-0 w-full z-40 border-b shadow-xl flex flex-col ${theme === "dark" ? "bg-[#202C33] border-[#374045] text-white" : "bg-white border-gray-200 text-black"}`}>
      <Link to="/home" onClick={() => setMenuOpen(false)} className={`px-6 py-3.5 hover:bg-[#F0F2F5] dark:hover:bg-[#2A3942] flex items-center gap-3 font-medium ${theme === "dark" ? "text-white" : "text-black"}`}>
        <span className="w-8 h-8 bg-[#DCF8C6] dark:bg-[#005C4B] rounded-full flex items-center justify-center text-"><FaHome /></span> Home
      </Link>
      <Link to="/profile" onClick={() => setMenuOpen(false)} className={`px-6 py-3.5 hover:bg-[#F0F2F5] dark:hover:bg-[#2A3942] flex items-center gap-3 font-medium ${theme === "dark" ? "text-white" : "text-black"}`}>
        <img src={myPic} className="w-8 h-8 rounded-full object-cover border-2 border-[#25D366]" /> Profile
      </Link>
      <Link to="/createpost" onClick={() => setMenuOpen(false)} className={`px-6 py-3.5 hover:bg-[#F0F2F5] dark:hover:bg-[#2A3942] flex items-center gap-3 font-medium ${theme === "dark" ? "text-white" : "text-black"}`}>
        <span className="w-8 h-8 bg-[#DCF8C6] dark:bg-[#005C4B] rounded-full flex items-center justify-center text-"><FaPlusSquare /></span> Create
      </Link>
      <Link to="/chat" onClick={() => setMenuOpen(false)} className={`px-6 py-3.5 hover:bg-[#F0F2F5] dark:hover:bg-[#2A3942] flex items-center gap-3 font-medium ${theme === "dark" ? "text-white" : "text-black"}`}>
        <span className="w-8 h-8 bg-[#DCF8C6] dark:bg-[#005C4B] rounded-full flex items-center justify-center text-"><FaRegPaperPlane /></span> Messages
      </Link>
      <button onClick={logOut} className="px-6 py-3.5 text-left text-red-500 font-semibold hover:bg-[#F0F2F5] dark:hover:bg-[#2A3942] flex items-center gap-3">
        <span className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-">↪</span> Log Out
      </button>
    </div>
  )}
</>
  );
}