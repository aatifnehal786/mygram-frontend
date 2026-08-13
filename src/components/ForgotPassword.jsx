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
  <section className="container">
    <div className="form">

      <h2>
        Reset Password
      </h2>

       <h4>Enter your Email to get OTP</h4>
      <div className="input-group">
        {/* Email */}
      <input
        type="email"
        name="email"
        placeholder=""
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={handleDynamicEnter}
        className="
          inp
        "
      />
      <label>Email</label>
      </div>

      <button
        ref={buttonRef1}
        type="button"
        onClick={Forgotpassword}
        disabled={isLoading}
        className="
        btn btn-2
        "
      >
        {isLoading ? <Spinner/> : "Send OTP"}
      </button>

      <div className="input-group">
        {/* OTP */}
      <input
        type="text"
        name="otp"
        placeholder=""
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        onKeyDown={handleDynamicEnter}
        className="
          input
        "
      />
      <label>Enter Otp</label>
      </div>

      {/* New Password */}
      <div className="input-group">
        <input
          type={isPassword ? "text" : "password"}
          name="newPassword"
          placeholder=""
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onKeyDown={handleDynamicEnter}
          className="
            input
          "
        />
        <label>New Password</label>
        <img
          src={isPassword ? show : hide}
          alt="Toggle password"
          onClick={showHide}
          className="pass3"
        />

        {/* Password Strength */}
        <div
          className={`
            mt-1 text-xs font-medium
            ${strength === "weak" && "text-red-500"}
            ${strength === "medium" && "text-yellow-500"}
            ${strength === "strong" && "text-green-600"}
          `}
        >
          {getStrengthText()}
        </div>
      </div>

      {/* Reset */}
      <button
        ref={buttonRef2}
        type="button"
        onClick={handleResetPassword}
        disabled={isLoading2}
        className="
          btn btn-1
        "
      >
        {isLoading2 ? <Spinner/> : "Reset Password"}
      </button>

      {/* Message */}
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Link */}
      <p className="text-center text-sm text-gray-500">
        <Link to="/login" className="text-blue-600 hover:underline">
          Go to Login page
        </Link>
      </p>
    </div>
  </section>
);

}
