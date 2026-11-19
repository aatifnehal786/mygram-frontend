import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import hide from "../assets/hide.png";
import show from "../assets/show.png";
import { apiFetch } from '../api/apiFetch'
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../Spinner";
import useUserStore from "../store/useUserStore";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const [user, setUser] = useState({ loginId: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isPassword, setIsPassword] = useState(false);
  const setLoggedUser = useUserStore((state) => state.setLoggedUser);
  const navigate = useNavigate();


const handleEnterKey = (e) => {
    if (e.key === "Enter") handleSubmit(e);
  };

const handleInput = (e) => {
  setUser((prev) => ({...prev, [e.target.name]: e.target.value.trim()
  }));
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  if (!user.loginId || !user.password) {
    toast.error("All fields are required");
    setIsLoading(false);
    return;
  }

  try {
    const data = await apiFetch("api/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...user }),
    });

    console.log("Login response:", data);
    
    if (data.token) {
      setLoggedUser(data); // this saves to localStorage key "token-auth"
      toast.success("Login Successful");
      
      // Remove initializeSocket() - SocketContext will do it automatically

      const isVerified = data.user?.isEmailVerified ?? data.isEmailVerified;
      if (!isVerified) {
        navigate("/verify-email", { replace: true });
      } else {
        navigate("/", { replace: true }); // only ONE navigate
      }
    }
  } catch (err) {
    console.error(err);
    toast.error(err.message || "Login failed");
  } finally {
    setIsLoading(false);
  }
};

  const showHide = () => setIsPassword((prev) => !prev);

 return (
    <section className="min-h-screen bg-[#ECE5DD] dark:bg-[#111B21] flex flex-col justify-center items-center relative">
      

  <div className="absolute top-4 right-4 z-50">
  <ThemeToggle />
</div>
  {/* WhatsApp Top Header Bar */}
  <div className="w-full bg-[#075E54] dark:bg-[#202C33] py-4 flex justify-center">
    <div className="flex items-center gap-2 text-white">
      <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-2xl font-bold">✓</div>
      <h1 className="text-xl font-semibold tracking-wide">MyGram</h1>
    </div>
  </div>

  <div className="flex w-full max-w- justify-center gap-8 px-4 mt-8">

    {/* Left - 【entity-WhatsApp¦canonical_name=WhatsApp】 Phone Mockup - Hide on mobile */}
    <div className="hidden lg:flex flex-col items-center justify-center w-">
      <div className="w- bg-white dark:bg-[#202C33] rounded- shadow-2xl overflow-hidden">
        {/* Chat Header inside phone */}
        <div className="bg-[#075E54] p-3 flex items-center gap-3 text-white">
          <div className="w-9 h-9 bg-white/30 rounded-full flex items-center justify-center">👤</div>
          <div>
            <p className="text-sm font-semibold leading-none">MyGram Chat</p>
            <p className="text- opacity-80">online</p>
          </div>
        </div>
        {/* Chat Messages inside phone */}
        <div className="bg-[#ECE5DD] p-3 space-y-2 h-">
          <div className="bg-white p-2 px-3 rounded-lg rounded-tl-none text- max-w-[80%] shadow-sm">Hey! Welcome to MyGram 👋</div>
          <div className="bg-[#DCF8C6] p-2 px-3 rounded-lg rounded-tr-none text- max-w-[80%] ml-auto shadow-sm">Hi! I just signed up</div>
          <div className="bg-white p-2 px-3 rounded-lg rounded-tl-none text- max-w-[80%] shadow-sm">Share photos, chat, video call - all in one app</div>
          <div className="bg-[#DCF8C6] p-2 px-3 rounded-lg rounded-tr-none text- max-w-[80%] ml-auto shadow-sm">Awesome, let's go! 🚀</div>
        </div>
        {/* Input inside phone */}
        <div className="bg-[#F0F2F5] p-2 flex gap-2">
          <div className="flex-1 bg-white rounded-full px-3 py-2 text- text-gray-400">Type a message</div>
          <div className="w-9 h-9 bg-[#25D366] rounded-full flex items-center justify-center text-white">➤</div>
        </div>
      </div>
      <p className="text- text-[#8696A0] mt-4 text-center">Photos • Chats • Video Calls • Stories</p>
    </div>

    {/* Right - Form */}
    <div className="w-full max-w- flex flex-col gap-2.5">
      {/* Main Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#202C33] border border-[#dbdbdb] dark:border-[#374045] rounded-xl shadow-sm flex flex-col items-center px-8 pt-8 pb-6"
      >
        {/* WhatsApp Logo - Replaces Instagram Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center mb-2">
            <span className="text-3xl text-white">✆</span>
          </div>
          <h1 className="text- font-bold tracking-wide text-[#111B21] dark:text-white">MyGram</h1>
          <p className="text- text-[#8696A0]">Login with password to continue</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <div className="relative">
            <input
              placeholder="Username or Email"
              type="text"
              onChange={handleInput}
              required
              name="loginId"
              value={user.loginId}
              className="w-full h- bg-[#F0F2F5] dark:bg-[#2A3942] dark:text-white border border-[#D1D7DB] dark:border-[#374045] rounded-lg px-3 text- outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20"
              onKeyDown={handleEnterKey}
            />
          </div>

          <div className="relative">
            <input
              placeholder="Password"
              type={isPassword ? "text" : "password"}
              onChange={handleInput}
              maxLength={16}
              required
              name="password"
              value={user.password}
              className="w-full h- bg-[#F0F2F5] dark:bg-[#2A3942] dark:text-white border border-[#D1D7DB] dark:border-[#374045] rounded-lg px-3 pr-12 text- outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20"
              onKeyDown={handleEnterKey}
            />
            <button
              type="button"
              onClick={showHide}
              className="absolute right-3 top-1/2 -translate-y-1/2 text- font-semibold text-[#25D366]"
            >
              {isPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            className="w-full h- bg-[#25D366] hover:bg-[#1EBE5A] text-white rounded-lg text- font-semibold mt-2 disabled:opacity-70 disabled:pointer-events-none transition"
            disabled={isLoading || !user.loginId || !user.password}
          >
            {isLoading ? <Spinner /> : "Log in"}
          </button>

          <div className="flex items-center my-2 gap-4">
            <div className="h- bg-[#D1D7DB] dark:bg-[#374045] flex-1" />
            <span className="text- font-semibold text-[#8696A0]">OR</span>
            <div className="h- bg-[#D1D7DB] dark:bg-[#374045] flex-1" />
          </div>

          <Link
            to="/forgot-password"
            className="text- text-[#128C7E] dark:text-[#25D366] text-center font-medium"
          >
            Forgot password?
          </Link>

          <Link
            to="/guest-login"
            className="w-full h- border border-[#D1D7DB] dark:border-[#374045] bg-[#F0F2F5] dark:bg-[#2A3942] text-[#111B21] dark:text-white rounded-lg flex items-center justify-center gap-2 text- font-semibold mt-1 hover:bg-[#E9EDEF] dark:hover:bg-[#374045]"
          >
            <span className="text-lg">👤</span> Continue as Guest
          </Link>
        </div>
      </form>

      {/* Signup Card */}
      <div className="bg-white dark:bg-[#202C33] border border-[#dbdbdb] dark:border-[#374045] rounded-xl h- flex items-center justify-center text- text-[#111B21] dark:text-white">
        <p>
          Don't have an account?{" "}
          <Link to="/register" className="text-[#25D366] font-semibold">
            Sign up
          </Link>
        </p>
      </div>

      {/* WhatsApp-style bottom note - Replaces Get the app */}
      <div className="flex flex-col items-center mt-2">
        <p className="text- text-[#8696A0] text-center leading-relaxed">
          By logging in, you agree to MyGram's<br />Terms & Privacy Policy
        </p>
      </div>
    </div>
  </div>

  {/* Footer - WhatsApp Style */}
  <footer className="mt-12 mb-6 text- text-[#8696A0] flex flex-wrap justify-center gap-x-4 gap-y-2 max-w- px-4">
    <span>About</span><span>Privacy</span><span>Terms</span><span>Help</span>
    <span>Contact</span><span>© 2026 MyGram by Aatif Nehal</span>
  </footer>
</section>
  );
}