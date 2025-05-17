// components/ThemeToggle.jsx
import { useContext } from "react";
import { ThemeContext } from "./ThemeProvider";
import './ThemeToggle.css'; // 👈 Import the CSS

export default function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="theme-toggle-container">
      <label className="switch">
        <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
        <span className="slider"></span>
      </label>
    </div>
  );
}
