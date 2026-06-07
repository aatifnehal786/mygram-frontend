// import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {BrowserRouter} from "react-router-dom";


import { UserProvider } from "../src/contexts/UserContext";
import { SocketProvider } from "../src/contexts/SocketContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <UserProvider>
    <SocketProvider>
      <App />
    </SocketProvider>
  </UserProvider>
);
