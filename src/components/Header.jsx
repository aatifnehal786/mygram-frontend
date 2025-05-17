import { useContext } from "react";
import { ThemeContext } from "./ThemeProvider";
import { UserContext } from "../contexts/UserContext";
import { useNavigate,Link } from "react-router-dom";

export default function Header() {
  const { toggleTheme, theme } = useContext(ThemeContext);
  const loggedData = useContext(UserContext);
  const navigate = useNavigate();

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
