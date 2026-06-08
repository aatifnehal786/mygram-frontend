
import React, { useEffect , useContext} from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/Login';
import './App.css'
import SignUp from './components/SignUp';
import Profile from './components/Profile';
import Chat from './components/Chat';
import CreatePost from './components/CreatePosts';
import Home from './components/Home';
import NotFound from './components/NotFound'
import Private from './components/Private'
import ForgotPassword from './components/ForgotPassword';
import Otp from './components/Otp';
import EmailOtp from './components/EmailOtp';
import Layout from './components/Layout'; // 👈 import the layout
import ChatSidebar from './components/ChatSideBar';
import PublicRoute from './components/PublicRoute';
import Devices from './components/Devices';
// import { SocketProvider } from './contexts/SocketContext';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getSocket } from "./contexts/SocketContext";









function App() {




useEffect(() => {
  if ("Notification" in window) {
    Notification.requestPermission();
  }
}, []);

function NotificationListener() {
  const socket = useContext(getSocket);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      const isChatRoute =
        window.location.pathname === "/chat";

      const browserHidden =
        document.visibilityState === "hidden";

      if (!isChatRoute || browserHidden) {
        if (Notification.permission === "granted") {
          const notification =
            new Notification(data.senderName, {
              body: data.text,
              icon: data.senderProfilePic,
            });

          notification.onclick = () => {
            window.focus();
            window.location.href = "/chat";
          };
        }
      }
    };

    socket.on(
      "newNotification",
      handleNotification
    );

    return () => {
      socket.off(
        "newNotification",
        handleNotification
      );
    };
  }, [socket]);

  return null;
}


 

const router = createBrowserRouter(
  [ 
    {
      path: "/",
      element: (
        <PublicRoute>
          <Login />
        </PublicRoute>
      ),
      errorElement: <NotFound />,
    },
    {
      path: "/register",
      element: (
        <PublicRoute>
          <SignUp />
        </PublicRoute>
      ),
    },
    {
      path: "/login",
      element: (
        <PublicRoute>
          <Login />
        </PublicRoute>
      ),
    },
    

    {
      element: <Layout />, // Wrap private routes with Header
      children: [
        {
          path: "/home",
          element: (
            <Private>
              <Home />
            </Private>
          ),
        },
        {
          path: "/getdevices",
          element: (
            <Private>
              <Devices />
            </Private>
          ),
        },
        {
          path: "/profile",
          element: (
            <Private>
              <Profile />
            </Private>
          ),
        },
        {
          path: "/chat",
          element: (
            <Private>
              <Chat />
            </Private>
          ),
        },
        {
          path: "/chatsidebar",
          element: (
            <Private>
              <ChatSidebar />
            </Private>
          ),
        },
        {
          path: "/createpost",
          element: (
            <Private>
              <CreatePost />
            </Private>
          ),
        },
        
      ],
    },
    {
      path: "/forgot-password",
      element: <ForgotPassword />,
    },
    {
      path: "/otp",
      element: <Otp />,
    },
    {
      path: "/emailotp",
      element: <EmailOtp />,
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_startTransition: true,
    },
  }
);



 return (
  <ThemeProvider>
    <ToastContainer position="top-right" autoClose={3000} />

    <NotificationListener />

    <RouterProvider router={router} />
  </ThemeProvider>
);
}

export default App;