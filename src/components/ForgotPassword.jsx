import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import hide from '../assets/hide.png';
import show from '../assets/show.png';
import { apiFetch } from "../api/apiFetch";
import { toast,ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../Spinner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [isPassword, setIsPassword] = useState(false);
  const [strength, setStrength] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);

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
    <section className="min-h-screen bg-[#fafafa] flex flex-col items-center">
      {/* Top Nav like Instagram */}
      <div className="w-full bg-white border-b border-[#dbdbdb] h-[60px] flex items-center justify-center">
        <h1 style={{ fontFamily: "'Grand Hotel', cursive" }} className="text-[32px]">Instagram</h1>
      </div>

      <div className="w-full max-w-[388px] mt-12 flex flex-col gap-2.5">
        <div className="bg-white border border-[#dbdbdb] flex flex-col items-center px-10 py-8">
          {/* Lock Icon Circle */}
          <div className="w-[96px] h-[96px] rounded-full border-2 border-black flex items-center justify-center mb-4">
            <span className="text-[48px]">🔒</span>
          </div>

          <h2 className="text-[16px] font-semibold mb-2">Trouble logging in?</h2>
          <p className="text-[14px] text-[#8e8e8e] text-center leading-[18px] mb-4">
            Enter your email and we'll send you an OTP to get back into your account.
          </p>

          <div className="w-full flex flex-col gap-2">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleDynamicEnter}
              className="w-full h-[38px] bg-[#fafafa] border border-[#dbdbdb] rounded-[3px] px-2 text-[12px] outline-none focus:border-[#a8a8a8]"
            />

            <button
              ref={buttonRef1}
              type="button"
              onClick={Forgotpassword}
              disabled={isLoading ||!email}
              className="w-full h-8 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-lg text-sm font-semibold mt-2 disabled:opacity-60"
            >
              {isLoading? <Spinner /> : "Send OTP"}
            </button>

            <div className="flex items-center my-3 gap-4">
              <div className="h-[1px] bg-[#dbdbdb] flex-1" />
              <span className="text-[13px] font-semibold text-[#8e8e8e]">OR</span>
              <div className="h-[1px] bg-[#dbdbdb] flex-1" />
            </div>

            <input
              type="text"
              name="otp"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onKeyDown={handleDynamicEnter}
              className="w-full h-[38px] bg-[#fafafa] border border-[#dbdbdb] rounded-[3px] px-2 text-[12px] outline-none focus:border-[#a8a8a8]"
            />

            <div className="relative mt-2">
              <input
                type={isPassword? "text" : "password"}
                name="newPassword"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={handleDynamicEnter}
                className="w-full h-[38px] bg-[#fafafa] border border-[#dbdbdb] rounded-[3px] px-2 pr-10 text-[12px] outline-none focus:border-[#a8a8a8]"
              />
              <img
                src={isPassword? show : hide}
                alt="Toggle"
                onClick={showHide}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer opacity-60"
              />
            </div>

            {/* Strength Text Instagram style */}
            {newPassword && (
              <p className={`text-[11px] mt-1 font-medium
                ${strength === "weak" && "text-red-500"}
                ${strength === "medium" && "text-yellow-500"}
                ${strength === "strong" && "text-green-600"}`}>
                {getStrengthText()}
              </p>
            )}

            <button
              ref={buttonRef2}
              type="button"
              onClick={handleResetPassword}
              disabled={isLoading2 ||!otp ||!newPassword}
              className="w-full h-8 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-lg text-sm font-semibold mt-3 disabled:opacity-60"
            >
              {isLoading2? <Spinner /> : "Reset Password"}
            </button>
          </div>

          <div className="w-full h-[1px] bg-[#dbdbdb] my-6" />

          <Link to="/register" className="text-[14px] font-semibold text-[#262626]">
            Create new account
          </Link>
        </div>

        <div className="bg-white border border-[#dbdbdb] h-[63px] flex items-center justify-center">
          <Link to="/login" className="text-[14px] font-semibold text-[#262626] border border-[#dbdbdb] w-full h-full flex items-center justify-center hover:bg-[#fafafa]">
            Back to login
          </Link>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </section>
  );

}
