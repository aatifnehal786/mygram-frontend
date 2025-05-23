import { useContext } from "react";
import { ThemeContext } from "./ThemeProvider";
import { UserContext } from "../contexts/UserContext";
import { useNavigate,Link } from "react-router-dom";
import { useState,useEffect } from "react";

export default function Header() {
  const { toggleTheme, theme } = useContext(ThemeContext);
  const loggedData = useContext(UserContext);
 const [targetUserId,setTargetUserId] = useState("")
  const navigate = useNavigate();

useEffect(() => {
  const fetchUsers = async () => {
    const res = await fetch('https://mygram-1-1nua.onrender.com/allusers2', {
      headers: {
        Authorization: `Bearer ${loggedData.loggedUser.token}`,
      },
    });

    const data = await res.json();
    console.log(data);

    // Find users who are following the logged-in user
    const followers = data.filter((user) =>
      user.following.includes(loggedData.loggedUser.userid)
    );

    console.log('Users following me:', followers);

    if (followers.length > 0) {
      setTargetUserId(followers[0]._id); // Or set an array of all followers
    }
  };

  fetchUsers();
}, []);

   

function logOut() {
// When logging out
localStorage.removeItem('token-auth');
loggedData.setLoggedUser(null);
navigate('/login', { replace: true }); // 👈 Replace history

}


  return (
    <nav className="nav-bar">
      <ul>
        <li><Link to='/home'>Home</Link></li>
        <li><Link to='/profile'>Profile</Link></li>
        <li><Link to='/createpost'>Create Post</Link></li>
        <li><Link to={`/chat/${targetUserId}`}>Chat</Link></li>



      
      </ul>
      <div className="theme-toggle-container">
      <label className="switch">
        <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
        <span className="slider"></span>
      </label>
    </div>
      <button className="btn btn-logout" onClick={logOut}>Log Out</button>
    </nav>
  );
}
