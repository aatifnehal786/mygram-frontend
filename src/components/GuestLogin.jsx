import React from "react";
// import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiFetch } from "../api/apiFetch";
import Spinner from "../Spinner";
import useUserStore from "../store/useUserStore";
import {useState} from 'react'
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from "../components/ThemeToggle";


export default function GuestLogin() {
    
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState("");
    const navigate = useNavigate();
    const setLoggedUser = useUserStore((state) => state.setLoggedUser);
    const { theme } = useTheme();

    const handleEnterKey = (e) => {
        if (e.key === "Enter") {
            handleGuestLogin();
        }
    };

   const handleGuestLogin = async () => {
  setLoading(true);
  try {
    const response = await apiFetch("api/auth/guest-login", {
      method: "POST",
      body: JSON.stringify({ fullName }),
    }); 
    console.log("Guest login response:", response);

    if (response.success) {
      // FIX: Add verification flags so Private.jsx lets you through
      const guestUserWithFlags = {
        ...response.user,
        isGuest: true,
        isVerified: true,
        isEmailVerified: true, // THIS IS WHAT Private.jsx CHECKS
      };

      setLoggedUser({
        user: guestUserWithFlags,
        token: response.token
      });

      toast.success("Logged in as guest!");
      navigate("/home", { replace: true });
    }
  } catch (error) {
    console.error("Error during guest login:", error);
    toast.error("Failed to log in as guest. Please try again.");
  } finally {
    setLoading(false);
  }
};


    return (
    <section className={`min-h-screen flex flex-col items-center ${theme === 'dark' ? 'bg-[#0B141A]' : 'bg-[#ECE5DD]'} relative`}>
      <div className="absolute top-4 right-4 z-50">
              <ThemeToggle />
            </div>
  {/* Top Nav - WhatsApp Style */}
  <div className={`w-full h- flex items-center justify-center shadow-sm ${theme === 'dark' ? 'bg-[#202C33]' : 'bg-[#075E54]'}`}>
    <h1 className="text- font-bold text-white tracking-tight flex items-center gap-2">
      <span className="w-9 h-9 bg-[#25D366] rounded-full flex items-center justify-center text-">💬</span>
      MyGram
    </h1>
  </div>

  <div className="w-full max-w- mt-10 px-4 flex flex-col gap-3">
    <div className={`border rounded-2xl flex flex-col items-center px-8 py-8 shadow-lg ${theme === 'dark' ? 'bg-[#202C33] border-[#374045]' : 'bg-white border-gray-200'}`}>

      {/* Guest Avatar - WhatsApp Green */}
      <div className="w- h- rounded-full bg-[#25D366] p- flex items-center justify-center mb-4">
        <span className={`text- w- h- rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-[#2A3942]' : 'bg-[#F0F2F5]'}`}>👤</span>
      </div>

      <h2 className="text- font-bold mb-1">Continue as Guest</h2>
      <p className="text- text-[#8696A0] text-center leading- mb-4 px-2">
        You are logging in as a guest. You can browse posts, but likes, comments & messages are limited.
      </p>

      <div className={`w-full rounded-xl p-3 mb-4 flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-[#005C4B]/30 border border-[#25D366]/30' : 'bg-[#DCF8C6] border border-[#25D366]/30'}`}>
        <span className="text-sm">⚠</span>
        <p className={`text- text-center font-medium ${theme === 'dark' ? 'text-[#A9E8C8]' : 'text-[#075E54]'}`}>
          Guest mode • Some features may be limited
        </p>
      </div>

      <div className="w-full flex flex-col gap-3">
        <label className="text-xs font-semibold text-[#8696A0] -mb-1">Guest Username</label>
        <input
          type="text"
          placeholder="Enter a guest username"
          name="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onKeyDown={handleEnterKey}
          maxLength={20}
          className={`w-full h- rounded-full px-4 text- outline-none border transition ${theme === 'dark' ? 'bg-[#2A3942] border-[#374045] placeholder:text-[#8696A0] focus:border-[#25D366]' : 'bg-[#F0F2F5] border-transparent focus:border-[#25D366] focus:bg-white placeholder:text-[#8696A0]'}`}
        />
        {fullName && (
          <p className="text- text-[#8696A0] -mt-1.5 ml-1">You will appear as <span className="font-semibold text-[#25D366]">{fullName}</span> • {fullName.length}/20</p>
        )}

        <button
          onClick={handleGuestLogin}
          onKeyDown={handleEnterKey}
          disabled={loading || !fullName.trim()}
          className="w-full h- bg-[#25D366] hover:bg-[#1EBE5A] text-white rounded-full text-sm font-semibold disabled:opacity-60 disabled:pointer-events-none transition shadow-sm flex items-center justify-center gap-2"
        >
          {loading ? <Spinner /> : <>👤 Continue as Guest</>}
        </button>

        <div className="flex items-center my-1 gap-4">
          <div className={`h- flex-1 ${theme === 'dark' ? 'bg-[#374045]' : 'bg-gray-200'}`} />
          <span className="text- font-semibold text-[#8696A0]">OR</span>
          <div className={`h- flex-1 ${theme === 'dark' ? 'bg-[#374045]' : 'bg-gray-200'}`} />
        </div>

        <Link
          to="/login"
          className={`w-full h- rounded-full flex items-center justify-center gap-2 text- font-semibold transition ${theme === 'dark' ? 'bg-[#2A3942] hover:bg-[#374045]' : 'bg-[#F0F2F5] hover:bg-gray-200'}`}
        >
          <span className="text-lg">🔑</span> Log in with an account
        </Link>

        <Link
          to="/register"
          className="w-full h- text-[#25D366] hover:text-[#1EBE5A] text- font-semibold flex items-center justify-center"
        >
          Create new account →
        </Link>
      </div>
    </div>

    <div className={`rounded-2xl py-4 px-6 flex items-center justify-center text-center shadow-sm ${theme === 'dark' ? 'bg-[#202C33] border border-[#374045]' : 'bg-white border border-gray-200'}`}>
      <p className="text-[#8696A0] text- leading-">
        ⏳ Guest profiles are temporary and will be removed after 24 hours.<br />
        <Link to="/register" className="text-[#25D366] font-semibold">Create an account</Link> to save your data.
      </p>
    </div>

    <p className="text-center text- text-[#8696A0] mt-1">
      No email needed for guest mode • Browse instantly
    </p>
  </div>
</section>
  );
}