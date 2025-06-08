import { useContext, useState, useEffect } from "react";
import { ThemeContext } from "./ThemeProvider";
import { UserContext } from "../contexts/UserContext";
import { useNavigate, Link } from "react-router-dom";

export default function Header() {
  const { toggleTheme, theme } = useContext(ThemeContext);
  const loggedData = useContext(UserContext);
  const [targetUserId, setTargetUserId] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch('https://mygram-1-1nua.onrender.com/allusers2', {
        headers: {
          Authorization: `Bearer ${loggedData.loggedUser.token}`,
        },
      });

      const data = await res.json();

      const followers = data.filter((user) =>
        user.following.includes(loggedData.loggedUser.userid)
      );

      if (followers.length > 0) {
        setTargetUserId(followers[0]._id);
      }
    };

    fetchUsers();
  }, []);

  function logOut() {
    localStorage.removeItem('token-auth');
    loggedData.setLoggedUser(null);
    navigate('/login', { replace: true });
  }

  return (
    <nav className="nav-bar">
      <div className="nav-header">
       
        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>

      <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
        <li><Link to='/home' onClick={() => setMenuOpen(false)}>Home</Link></li>
        <li><Link to='/profile' onClick={() => setMenuOpen(false)}>Profile</Link></li>
        <li><Link to='/createpost' onClick={() => setMenuOpen(false)}>Create Post</Link></li>
        <li><Link to={`/chat/${targetUserId}`} onClick={() => setMenuOpen(false)}>Chat</Link></li>
        <li>
          <div className="theme-toggle-container">
            <label className="switch">
              <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
              <span className="slider"></span>
            </label>
          </div>
        </li>
        <li>
          <button className="btn btn-logout" onClick={logOut}>Log Out</button>
        </li>
      </ul>
    </nav>
  );
}
