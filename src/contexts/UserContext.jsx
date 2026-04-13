import { createContext, useState, useEffect } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext();

export function UserProvider({ children }) {
  const [loggedUser, setLoggedUser] = useState(() => {
    try {
      const data = localStorage.getItem("token-auth");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  });

  // ✅ Sync on mount (important for refresh)
  useEffect(() => {
    try {
      const data = localStorage.getItem("token-auth");
      if (data) {
        setLoggedUser(JSON.parse(data));
      }
    } catch {
      setLoggedUser(null);
    }
  }, []);

  // ✅ Sync to localStorage
  useEffect(() => {
    if (loggedUser) {
      localStorage.setItem("token-auth", JSON.stringify(loggedUser));
    } else {
      localStorage.removeItem("token-auth");
    }
  }, [loggedUser]);

  // ✅ Cross-tab sync
  useEffect(() => {
    const syncAuth = (e) => {
      if (e.key === "token-auth") {
        setLoggedUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  return (
    <UserContext.Provider value={{ loggedUser, setLoggedUser }}>
      {children}
    </UserContext.Provider>
  );
}