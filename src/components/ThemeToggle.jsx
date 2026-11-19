import { useTheme } from "../contexts/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition shrink-0
        ${theme === "dark"
          ? "bg-[#2A3942] text-yellow-400 hover:bg-[#374045]"
          : "bg-[#F0F2F5] text-[#075E54] hover:bg-gray-200"
        } ${className}`}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}