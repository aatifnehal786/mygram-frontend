import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import hide from '../assets/hide.png';
import show from '../assets/show.png';
import { apiFetch } from "../api/apiFetch";
import { toast,ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../Spinner";
import { useTheme } from '../contexts/ThemeContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [isPassword, setIsPassword] = useState(false);
  const [strength, setStrength] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const {theme} = useTheme();
  const buttonRef1 = useRef();
  const buttonRef2 = useRef();

  // Handle Enter key dynamically based on filled fields
 const handleDynamicEnter = (e) => {
  if (e.key === 'Enter') {
    if (document.activeElement.name === 'otp' || document.activeElement.name === 'newPassword') {
      buttonRef2.current.click(); // Reset Password
    } else if (document.activeElement.name === 'email') {
      buttonRef1.current.click(); // Send OTP
    }
  }
};


// PASSWORD CHECKER ( WEAK , MEDIUM , STRONG )
useEffect(() => {
    const val = newPassword;
    const weakRegex = /.{1,5}/;
    const mediumRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.{6,})/;
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (strongRegex.test(val)) setStrength("strong");
    else if (mediumRegex.test(val)) setStrength("medium");
    else if (weakRegex.test(val)) setStrength("weak");
    else setStrength("");

     if (typingTimeout) clearTimeout(typingTimeout);

  // Set timeout to clear strength after 2 seconds of inactivity
  const timeout = setTimeout(() => {
    setStrength("");
  }, 3000);

  setTypingTimeout(timeout);

  // Cleanup on component unmount
  return () => clearTimeout(timeout);
  }, [newPassword]);

  const getStrengthText = () => {
    switch (strength) {
      case "weak":
        return "Weak Password";
      case "medium":
        return "Medium Password";
      case "strong":
        return "Strong Password";
      default:
        return "";
    }
  };

// HANDLE OTP SEDING CALL FOR RESSETING PASSWORD


  const Forgotpassword = async () => {
    if (!email) {
      toast.error("Email is required");
      setEmail("");
      return;
    }

    setIsLoading(true);

    try {
     

      const data = await apiFetch("api/password/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        
      });

      

      if (data?.error) {
        toast.error(data.error || "Failed to send OTP");
      } else {
        toast.success(data.message || "OTP sent!");
      }

      // Clear message after 3 seconds setTimeout(() => setMessage({ type: "", text: "" }), 5000);

    } catch (err) {
      console.error("Forgot password error:", err);
      toast.error("Failed to send OTP. Try again.");

    } finally {
      setIsLoading(false); // ✅ ensures button always resets
    }
  };




// HANDLE RESET PASSWORD

const handleResetPassword = async () => {
  if (!newPassword) {
    toast.error("New password is required");
    return;
  }

  try {
    setIsLoading2(true);

    const data = await apiFetch("api/password/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, newPass: newPassword, otp }),
    });

    setIsLoading2(false);

    if (data.error) {
      toast.error(data.error || "Failed to reset password");
    } else {
      toast.success(data.message || "Password reset successfully!");
       setTimeout(() => {
        setEmail("");
        setOtp("");
        setNewPassword("");
    } , 5000);
      
    }
  } catch (err) {
    console.error("Error resetting password:", err);
    toast.error("Failed to reset password.");
    setIsLoading2(false);
  }
};


  const showHide = () => {
    setIsPassword((prev) => !prev);
  };

 return (
    <section className={`min-h-screen flex flex-col items-center ${theme === 'dark' ? 'bg-[#0B141A]' : 'bg-[#ECE5DD]'}`}>
  {/* Top Nav - WhatsApp Style */}
  <div className={`w-full h- flex items-center justify-center shadow-sm ${theme === 'dark' ? 'bg-[#202C33]' : 'bg-[#075E54]'}`}>
    <h1 className="text- font-bold text-white tracking-tight flex items-center gap-2">
      <span className="w-9 h-9 bg-[#25D366] rounded-full flex items-center justify-center text-">💬</span>
      MyGram
    </h1>
  </div>

  <div className="w-full max-w- mt-10 px-4 flex flex-col gap-3">
    <div className={`border rounded-2xl flex flex-col items-center px-8 py-8 shadow-lg ${theme === 'dark' ? 'bg-[#202C33] border-[#374045]' : 'bg-white border-gray-200'}`}>
      {/* Lock Icon - WhatsApp Green */}
      <div className="w- h- rounded-full bg-[#25D366]/10 border-2 border-[#25D366] flex items-center justify-center mb-4">
        <span className="text-">🔒</span>
      </div>

      <h2 className="text- font-bold mb-2">Trouble logging in?</h2>
      <p className="text- text-[#8696A0] text-center leading- mb-5">
        Enter your email and we'll send you an OTP to get back into your account.
      </p>

      <div className="w-full flex flex-col gap-2.5">
        <label className="text-xs font-semibold text-[#8696A0] -mb-1">Email address</label>
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleDynamicEnter}
          className={`w-full h- rounded-full px-4 text- outline-none border transition ${theme === 'dark' ? 'bg-[#2A3942] border-[#374045] placeholder:text-[#8696A0] focus:border-[#25D366]' : 'bg-[#F0F2F5] border-transparent focus:border-[#25D366] focus:bg-white placeholder:text-[#8696A0]'}`}
        />

        <button
          ref={buttonRef1}
          type="button"
          onClick={Forgotpassword}
          disabled={isLoading || !email}
          className="w-full h- bg-[#25D366] hover:bg-[#1EBE5A] text-white rounded-full text-sm font-semibold mt-1 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm flex items-center justify-center"
        >
          {isLoading ? <Spinner /> : "Send OTP"}
        </button>

        <div className="flex items-center my-2 gap-4">
          <div className={`h- flex-1 ${theme === 'dark' ? 'bg-[#374045]' : 'bg-gray-200'}`} />
          <span className="text- font-semibold text-[#8696A0]">OR</span>
          <div className={`h- flex-1 ${theme === 'dark' ? 'bg-[#374045]' : 'bg-gray-200'}`} />
        </div>

        <label className="text-xs font-semibold text-[#8696A0] -mb-1">OTP Code</label>
        <input
          type="text"
          name="otp"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          onKeyDown={handleDynamicEnter}
          maxLength={6}
          inputMode="numeric"
          className={`w-full h- rounded-full px-4 text- tracking- font-semibold text-center outline-none border transition ${theme === 'dark' ? 'bg-[#2A3942] border-[#374045] placeholder:text-[#8696A0] placeholder:tracking-normal placeholder:font-normal focus:border-[#25D366]' : 'bg-[#F0F2F5] border-transparent focus:border-[#25D366] focus:bg-white placeholder:text-[#8696A0] placeholder:tracking-normal placeholder:font-normal'}`}
        />

        <label className="text-xs font-semibold text-[#8696A0] -mb-1 mt-1">New Password</label>
        <div className="relative">
          <input
            type={isPassword ? "text" : "password"}
            name="newPassword"
            placeholder="Create new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyDown={handleDynamicEnter}
            className={`w-full h- rounded-full px-4 pr-11 text- outline-none border transition ${theme === 'dark' ? 'bg-[#2A3942] border-[#374045] placeholder:text-[#8696A0] focus:border-[#25D366]' : 'bg-[#F0F2F5] border-transparent focus:border-[#25D366] focus:bg-white placeholder:text-[#8696A0]'}`}
          />
          <img
            src={isPassword ? show : hide}
            alt="Toggle"
            onClick={showHide}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer opacity-60 hover:opacity-100"
          />
        </div>

        {/* Strength - WhatsApp Colors */}
        {newPassword && (
          <>
            <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-[#2A3942] overflow-hidden mt-1">
              <div className={`h-full rounded-full transition-all ${strength === "weak" ? "w-1/3 bg-red-500" : strength === "medium" ? "w-2/3 bg-yellow-500" : "w-full bg-[#25D366]"}`} />
            </div>
            <p className={`text- font-medium
              ${strength === "weak" && "text-red-500"}
              ${strength === "medium" && "text-yellow-500"}
              ${strength === "strong" && "text-[#25D366]"}`}>
              {getStrengthText()}
            </p>
          </>
        )}

        <button
          ref={buttonRef2}
          type="button"
          onClick={handleResetPassword}
          disabled={isLoading2 || !otp || !newPassword}
          className="w-full h- bg-[#25D366] hover:bg-[#1EBE5A] text-white rounded-full text-sm font-semibold mt-2 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm flex items-center justify-center"
        >
          {isLoading2 ? <Spinner /> : "Reset Password"}
        </button>
      </div>

      <div className={`w-full h- my-5 ${theme === 'dark' ? 'bg-[#374045]' : 'bg-gray-200'}`} />

      <Link to="/register" className="text- font-semibold text-[#25D366] hover:text-[#1EBE5A]">
        Create new account
      </Link>
      <p className="text-xs text-[#8696A0] mt-1 text-center">Don't have an account? Sign up free</p>
    </div>

    <div className={`rounded-2xl h- flex items-center justify-center shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-[#202C33] border border-[#374045]' : 'bg-white border border-gray-200'}`}>
      <Link to="/login" className={`text- font-semibold w-full h-full flex items-center justify-center gap-2 transition ${theme === 'dark' ? 'hover:bg-[#2A3942]' : 'hover:bg-[#F0F2F5]'}`}>
        <span>←</span> Back to login
      </Link>
    </div>

    <p className="text-center text- text-[#8696A0] mt-1">
      Protected by MyGram • Your OTP is valid for 10 minutes
    </p>
  </div>

  <ToastContainer position="top-right" autoClose={3000} />
</section>
  );

}
