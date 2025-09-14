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
    setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 3000);
    return;
  }

  try {
    setIsLoading(true);

    const data = await apiFetch("/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    setMessage({ type: "success", text: data.message });
    setTimeout(() => {
      setMessage({ type: "", text: "" });
      setEmail("");
      setNewPassword("");
      setOtp("");
      setIsLoading(false);
    }, 10000);
  } catch (error) {
    console.error("Error sending forgot-password request:", error);
    setMessage({ type: "error", text: "Failed to send OTP" });
    setIsLoading(false);
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

    const data = await apiFetch("/reset-password", {
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
    <section className="container2">
      <div className="form">
        <h2>Enter your Email to get OTP and Enter new Password</h2>

        <input
          onKeyDown={handleDynamicEnter}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter Your Email"
          className="inp1"
          type="email"
          value={email}
          name="email"
        />

        <button
          ref={buttonRef1}
          type="submit"
          onClick={Forgotpassword}
          className="btn-2"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Send"}
        </button>

        <input
          className="inp1"
          name="otp"
          onChange={(e) => setOtp(e.target.value)}
          onKeyDown={handleDynamicEnter}
          type="text"
          placeholder="Enter OTP"
          value={otp}
        />
         <div className="pass3">
           <input
            className="inp1"
            name="newPassword"
            type={isPassword ? "text" : "password"}
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyDown={handleDynamicEnter}
          />
        
           <img
           
            onClick={showHide}
            src={isPassword ? show : hide}
            alt="Toggle"
           
          />
           <div className={`strength ${strength}`}>{getStrengthText()}</div>
         </div>

        <button
          ref={buttonRef2}
          type="submit"
          className="btn-3"
          onClick={handleResetPassword}
          disabled={isLoading2}
        >
          {isLoading2 ? "Loading..." : "Reset"}
        </button>

        <Link className="link" to="/login">Go to Login page</Link>

        {message?.text && (
          <p className={message.type}>
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}
