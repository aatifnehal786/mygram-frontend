import { Outlet } from "react-router-dom";
import Header from "./Header";
import { useTheme } from "../contexts/ThemeContext";

export default function Layout() {

  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col transition-all duration-300
      ${
        theme === "dark"
          ? "bg-black text-white"
          : "bg-gray-100 text-black"
      }`}
    >

      {/* Header */}
      <Header />

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`fixed top-2 right-12 px-2 py-2 rounded-full shadow-lg z-50
        ${
          theme === "dark"
            ? "bg-white text-black"
            : "bg-black text-white"
        }`}
      >
        {theme === "dark" ? "☀ Light" : "🌙 Dark"}
      </button>

      {/* Main Content */}
      <main className="flex-1 pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-h-screen-lg mx-auto">
          <Outlet />
        </div>
      </main>

    </div>
  );
}