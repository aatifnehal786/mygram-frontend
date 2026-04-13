import { useContext, useState } from "react";

import { UserContext } from "../contexts/UserContext";
import { useNavigate, Link } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { RxCross1 } from "react-icons/rx";



export default function Header() {

  
  const loggedData = useContext(UserContext);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();




// FETCH ALL USERS EXCEPT THE CURRENT LOGGED IN





  function logOut() {
    localStorage.removeItem('token-auth');
    sessionStorage.removeItem("token-auth")
    localStorage.removeItem('chatUnlocked')
    loggedData.setLoggedUser(null);
    navigate('/login', { replace: true });
  }

  const toggleMenu = ()=>{
    setMenuOpen((prev)=>!prev)
  }

  const removeMenu = ()=>{
    setTimeout(()=>{
     setMenuOpen(false)
   },100)
  }

  return (
  <header className="bg-white border-b shadow-sm relative z-50">
    <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

      {/* Logo */}
      <h1 className="text-xl font-bold text-blue-600">
        MyGram
      </h1>

      {/* Desktop Links */}
      <ul className="hidden md:flex items-center gap-6 text-sm font-medium">
        <li><Link to="/home" className="hover:text-blue-600">Home</Link></li>
        <li><Link to="/profile" className="hover:text-blue-600">Profile</Link></li>
        <li><Link to="/createpost" className="hover:text-blue-600">Create Post</Link></li>
        <li><Link to="/chat" className="hover:text-blue-600">Chat</Link></li>
        <li><Link to="/getdevices" className="hover:text-blue-600">Devices</Link></li>
      </ul>

      {/* Desktop Logout */}
      <button
        onClick={logOut}
        className="
          hidden md:block bg-red-500 text-white px-4 py-2 rounded-md text-sm
          hover:bg-red-600 transition
        "
      >
        Log Out
      </button>

      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden text-2xl text-gray-700"
      >
        {menuOpen ? <RxCross1 /> : <FaBars />}
      </button>
    </nav>

    {/* Mobile Menu */}
    {menuOpen && (
      <div className="md:hidden bg-white border-t shadow-md">
        <ul className="flex flex-col divide-y text-sm">
          <li>
            <Link onClick={removeMenu} to="/home" className="block px-4 py-3">
              Home
            </Link>
          </li>
          <li>
            <Link onClick={removeMenu} to="/profile" className="block px-4 py-3">
              Profile
            </Link>
          </li>
          <li>
            <Link onClick={removeMenu} to="/createpost" className="block px-4 py-3">
              Create Post
            </Link>
          </li>
          <li>
            <Link onClick={removeMenu} to="/chat" className="block px-4 py-3">
              Chat
            </Link>
          </li>
          <li>
            <Link onClick={removeMenu} to="/getdevices" className="block px-4 py-3">
              Devices
            </Link>
          </li>
          <li className="px-4 py-3">
            <button
              onClick={logOut}
              className="w-full bg-red-500 text-white py-2 rounded-md"
            >
              Log Out
            </button>
          </li>
        </ul>
      </div>
    )}
  </header>
);

}