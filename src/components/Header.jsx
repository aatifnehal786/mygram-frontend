import { useContext, useState, useEffect } from "react";

import { UserContext } from "../contexts/UserContext";
import { useNavigate, Link } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { RxCross1 } from "react-icons/rx";
import { apiFetch } from "../api/apiFetch";
import './chat.css'
import { useSocket } from '../contexts/SocketContext';

export default function Header() {

  const {loggedUser} = useContext(UserContext);
  const loggedData = useContext(UserContext);
  const [targetUserId, setTargetUserId] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const {unreadCounts} = useSocket();



// FETCH ALL USERS EXCEPT THE CURRENT LOGGED IN

useEffect(()=>{
  console.log(unreadCounts);
},[])

useEffect(() => {
  const fetchUsers = async () => {
    try {
      const data = await apiFetch("api/user/allusers2");

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
      console.error("Error fetching users:", err.message);
    }
  };

  if (loggedUser?.token) {
    fetchUsers();
  }
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
   <div>
    <header>
    

     <nav className="header">
    
      <ul className={menuOpen ? "nav-links active" : "nav-links"}>
        <li><Link onClick={removeMenu} to='/home'>Home</Link></li>
        <li><Link onClick={removeMenu} to='/profile'>Profile</Link></li>
        <li><Link onClick={removeMenu} to='/createpost' >Create Post</Link></li>
        <li><Link onClick={removeMenu} to={'/chat'}>Chat</Link></li>
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

   
   </div>
  );
}