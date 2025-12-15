import { createContext, useContext, useState } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [unreadCounts, setUnreadCounts] = useState({});

  const addUnread = (senderId) => {
    setUnreadCounts(prev => ({
      ...prev,
      [senderId]: (prev[senderId] || 0) + 1
    }));
  };

  const clearUnread = (userId) => {
    setUnreadCounts(prev => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });
  };

  return (
    <NotificationContext.Provider value={{
      unreadCounts,
      addUnread,
      clearUnread
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
