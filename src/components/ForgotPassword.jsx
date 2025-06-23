import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import hide from '../assets/hide.png';
import show from '../assets/show.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [isPassword, setIsPassword] = useState(false);

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


  const Forgotpassword = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("https://mygram-1-1nua.onrender.com/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      setIsLoading(false);
      setMessage({ type: "success", text: data.message });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
        setEmail("");
      }, 5000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to send OTP" });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      setMessage({ type: "error", text: "Password cannot be empty." });
      return;
    }

    try {
      setIsLoading2(true);
      const res = await fetch("https://mygram-1-1nua.onrender.com/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, newPass: newPassword, otp }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
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
        }, 3000);
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage({ type: "error", text: "Failed to reset password." });
    }
  };

  const showHide = () => {
    setIsPassword((prev) => !prev);
  };

  return (
    <section className="container">
      <div className="form3">
        <h4>Enter your Email to get OTP</h4>

        <input
          onKeyDown={handleDynamicEnter}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter Your Email"
          className="inp"
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
          className="inp"
          name="otp"
          onChange={(e) => setOtp(e.target.value)}
          onKeyDown={handleDynamicEnter}
          type="text"
          placeholder="Enter OTP"
          value={otp}
        />

        <div>
          <input
            className="inp"
            name="newPassword"
            type={isPassword ? "text" : "password"}
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyDown={handleDynamicEnter}
          />
          <img
            className="pass3"
            onClick={showHide}
            src={isPassword ? show : hide}
            alt="Toggle"
           
          />
        </div>

        <button
          ref={buttonRef2}
          type="submit"
          className="btn-1"
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
