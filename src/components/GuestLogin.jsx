import React from "react";
// import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiFetch } from "../api/apiFetch";
import Spinner from "../Spinner";
import useUserStore from "../store/useUserStore";
import {useState} from 'react'

export default function GuestLogin() {
    
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState("");
    const navigate = useNavigate();
    const setLoggedUser = useUserStore((state) => state.setLoggedUser);

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
    <section className="min-h-screen bg-[#fafafa] flex flex-col items-center">
      <div className="w-full bg-white border-b border-[#dbdbdb] h-[60px] flex items-center justify-center">
        <h1 style={{ fontFamily: "'Grand Hotel', cursive" }} className="text-[32px]">Instagram</h1>
      </div>

      <div className="w-full max-w-[350px] mt-14 flex flex-col gap-2.5">
        <div className="bg-white border border-[#dbdbdb] flex flex-col items-center px-10 py-8">

          {/* Guest Avatar */}
          <div className="w-[96px] h-[96px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center mb-4">
            <span className="text-[42px] bg-white w-[90px] h-[90px] rounded-full flex items-center justify-center">👤</span>
          </div>

          <h2 className="text-[16px] font-semibold mb-1">Continue as Guest</h2>
          <p className="text-[12px] text-[#8e8e8e] text-center leading-[16px] mb-4 px-2">
            You are logging in as a guest. You can browse posts, but likes, comments & messages are limited.
          </p>

          <div className="w-full bg-[#fff8e6] border border-[#ffe7a8] rounded-[4px] p-2.5 mb-4">
            <p className="text-[11px] text-[#8a6d3b] text-center">
              ⚠️ Guest mode • Some features may be limited
            </p>
          </div>

          <div className="w-full flex flex-col gap-3">
            <input
              type="text"
              placeholder="Enter a guest username"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-[38px] bg-[#fafafa] border border-[#dbdbdb] rounded-[3px] px-2 text-[12px] outline-none focus:border-[#a8a8a8] placeholder:text-[12px]"
            />

            <button
              onClick={handleGuestLogin}
              onKeyDown={handleEnterKey}
              disabled={loading ||!fullName.trim()}
              className="w-full h-8 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-lg text-sm font-semibold disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading? <Spinner /> : "Continue as Guest"}
            </button>

            <div className="flex items-center my-2 gap-4">
              <div className="h-[1px] bg-[#dbdbdb] flex-1" />
              <span className="text-[13px] font-semibold text-[#8e8e8e]">OR</span>
              <div className="h-[1px] bg-[#dbdbdb] flex-1" />
            </div>

            <Link
              to="/login"
              className="w-full h-8 border border-[#dbdbdb] bg-[#fafafa] text-[#00376b] rounded-lg flex items-center justify-center gap-2 text-[14px] font-semibold mt-3 hover:bg-[#f0f0f0]"
            >
              <span className="text-lg text-blue-500 hover:text-green-500">🔑</span>Log in with an account
            </Link>

            <Link
              to="/register"
              className="w-full h-8 bg-white text-[#0095f6] text-[14px] font-semibold flex items-center justify-center"
            >
              Create new account
            </Link>
          </div>
        </div>

        <div className="bg-white border border-[#dbdbdb] h-[63px] flex items-center justify-center text-[14px] px-6 text-center">
          <p className="text-[#8e8e8e] text-[12px] leading-[14px]">
            Guest profiles are temporary and will be removed after 24 hours. Create an account to save your data.
          </p>
        </div>
      </div>
    </section>
  );
}