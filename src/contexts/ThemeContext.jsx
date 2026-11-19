import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // 1. Saved preference first
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    // 2. Else system preference
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    // ✅ THIS WAS MISSING - Tailwind dark: needs this
    document.documentElement.classList.toggle("dark", theme === "dark");
    // For your custom theme === 'dark' checks
    document.documentElement.setAttribute("data-theme", theme);
    // Body bg so no white flash on reload
    document.body.style.backgroundColor = theme === "dark" ? "#0B141A" : "#ECE5DD";
    document.body.style.color = theme === "dark" ? "#E9EDEF" : "#111B21";
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);