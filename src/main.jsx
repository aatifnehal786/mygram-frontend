// import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SocketProvider } from "./contexts/SocketContext";
import GlobalNotifications from "./components/GlobalNotifications";


ReactDOM.createRoot(document.getElementById("root")).render(
 
    <SocketProvider>
      <GlobalNotifications /> {/* 👈 ALWAYS ACTIVE */}
      <App />
    </SocketProvider>
  
);
