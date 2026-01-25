import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import hide from '../assets/hide.png';
import show from '../assets/show.png';
import { apiFetch } from "../api/apiFetch";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
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
      setMessage({ type: "error", text: "Email is required" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return;
    }

    setIsLoading(true);

    try {
      // Optional: AbortController to prevent infinite waiting
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const data = await apiFetch("api/password/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (data?.error) {
        setMessage({ type: "error", text: data.error });
      } else {
        setMessage({ type: "success", text: data.message || "OTP sent!" });
      }

      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);

    } catch (err) {
      console.error("Forgot password error:", err);
      setMessage({ type: "error", text: "Failed to send OTP. Try again." });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } finally {
      setIsLoading(false); // ✅ ensures button always resets
    }
  };




// HANDLE RESET PASSWORD

const handleResetPassword = async () => {
  if (!newPassword) {
    setMessage({ type: "error", text: "Password cannot be empty." });
    setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 3000);
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
      setMessage({ type: "error", text: data.error });
    } else {
      setMessage({ type: "success", text: data.message });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
        setEmail("");
        setNewPassword("");
        setOtp("");
      }, 8000);
    }
  } catch (err) {
    console.error("Error resetting password:", err);
    setMessage({ type: "error", text: "Failed to reset password." });
    setIsLoading2(false);
  }
};


  const showHide = () => {
    setIsPassword((prev) => !prev);
  };

  return (
  <section className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow-md space-y-4">

      <h2 className="text-lg font-semibold text-center">
        Reset Password
      </h2>

      <p className="text-xs text-gray-500 text-center">
        Enter your email to receive an OTP and set a new password
      </p>

      {/* Email */}
      <input
        type="email"
        name="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={handleDynamicEnter}
        className="
          w-full px-4 py-2 rounded-lg border text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
      />

      <button
        ref={buttonRef1}
        type="button"
        onClick={Forgotpassword}
        className="
          w-full bg-blue-600 text-white py-2 rounded-lg text-sm
          hover:bg-blue-700 transition
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isLoading ? "Sending OTP..." : "Send OTP"}
      </button>

      {/* OTP */}
      <input
        type="text"
        name="otp"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        onKeyDown={handleDynamicEnter}
        className="
          w-full px-4 py-2 rounded-lg border text-sm tracking-widest
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
      />

      {/* New Password */}
      <div className="relative">
        <input
          type={isPassword ? "text" : "password"}
          name="newPassword"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onKeyDown={handleDynamicEnter}
          className="
            w-full px-4 py-2 rounded-lg border text-sm pr-10
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />

        <img
          src={isPassword ? show : hide}
          alt="Toggle password"
          onClick={showHide}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer opacity-70 hover:opacity-100"
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
          w-full bg-green-600 text-white py-2 rounded-lg text-sm
          hover:bg-green-700 transition
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isLoading2 ? "Resetting..." : "Reset Password"}
      </button>

      {/* Message */}
      {message?.text && (
        <p
          className={`
            text-center text-sm
            ${message.type === "success"
              ? "text-green-600"
              : "text-red-600"}
          `}
        >
          {message.text}
        </p>
      )}

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
