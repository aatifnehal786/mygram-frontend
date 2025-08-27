import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { UserContext } from './contexts/UserContext';
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




function App() {
  const [loggedUser, setLoggedUser] = useState(
  JSON.parse(sessionStorage.getItem('token-auth'))
);

 


const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
    errorElement: <NotFound />,
  },
  {
    path: '/register',
    element: <SignUp />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: <Layout />, // Wrap private routes with Header
    children: [
      {
        path: '/home',
        element: <Private Component={Home} />,
      },
      {
        path: '/profile',
        element: <Private Component={Profile} />,
      },
   
{
  path: '/chat/:targetUserId',
  element: <Private Component={ChatWrapper} />,
},
{
  path: '/setChatPin',
  element: <Private Component={SetChatPin} />,
},

{
  path: '/chatsidebar',
  element: <Private Component={ChatSidebar} />,
},

      {
        path: '/createpost',
        element: <Private Component={CreatePost} />,
      },
      
    ],
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/otp',
    element: <Otp />,
  },
  {
    path: '/emailotp',
    element: <EmailOtp />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
], {
  future: {
    v7_relativeSplatPath: true,
    v7_startTransition: true,
  },
});


  return (
    <UserContext.Provider value={{ loggedUser, setLoggedUser }}>
      <RouterProvider router={router} />
    </UserContext.Provider>
  );
}

export default App;