// import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SocketProvider } from "./contexts/SocketContext";
import { ThemeProvider } from "./contexts/ThemeContext";



ReactDOM.createRoot(document.getElementById("root")).render(
<ThemeProvider>
      
<SocketProvider>
  <App />
</SocketProvider>
</ThemeProvider>
    
  
);
