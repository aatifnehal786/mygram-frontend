import { useContext, useState, useEffect } from "react";

import { UserContext } from "../contexts/UserContext";
import { useNavigate, Link } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { RxCross1 } from "react-icons/rx";
import './chat.css'

export default function Header() {

  const {loggedUser} = useContext(UserContext);
  const [targetUserId, setTargetUserId] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
useEffect(() => {
  const fetchUsers = async () => {
    try {
      const res = await fetch("https://mygram-1-1nua.onrender.com/allusers2", {
        headers: {
          
          Authorization: `Bearer ${loggedUser.token}`,
          "x-device-id": localStorage.getItem("deviceId"), // 👈 required
        },
      });

      const data = await res.json();
      console.log("Fetched users response:", data);

      // ✅ Ensure we use the array
      const users = Array.isArray(data.users) ? data.users : [];

      const followers = users.filter((user) =>
        user.following.includes(loggedData.loggedUser.userid)
      );

      if (followers.length > 0) {
        setTargetUserId(followers[0]._id);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  fetchUsers();
}, [loggedUser]);


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
   <header>
    

     <nav className="header">
    
      <ul className={menuOpen ? "nav-links active" : "nav-links"}>
        <li><Link onClick={removeMenu} to='/home'>Home</Link></li>
        <li><Link onClick={removeMenu} to='/profile'>Profile</Link></li>
        <li><Link onClick={removeMenu} to='/createpost' >Create Post</Link></li>
        <li><Link onClick={removeMenu} to={`/chat/${targetUserId}`}>Chat</Link></li>
        <li><Link onClick={removeMenu} to={'/getdevices'}>Devices</Link></li>
        <li>
         </li>
      </ul>
       <button className="btn btn-logout" onClick={logOut}>Log Out</button>
    </nav>
   
    <div className="icon" onClick={toggleMenu}>
          {menuOpen ? <RxCross1 /> : <FaBars />}
        </div>
   </header>
  );
}