import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
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
import ChatWrapper from './components/chatWrapper';
import ChatSidebar from './components/ChatSideBar';
import SetChatPin from './components/setChatPin';
import PublicRoute from './components/PublicRoute';






function App() {
  const [loggedUser, setLoggedUser] = useState(
  JSON.parse(localStorage.getItem('token-auth'))
);

 

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
          path: "/profile",
          element: (
            <Private>
              <Profile />
            </Private>
          ),
        },
        {
          path: "/chat/:targetUserId",
          element: (
            <Private>
              <ChatWrapper />
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
    <UserProvider>
      <RouterProvider router={router} />
    </UserProvider>
  );
}

export default App;