import React, { useState } from "react";
import { apiFetch } from "../api/apiFetch";


export default function ForgotChatPin({ onClose }) {
  const [email, setEmail] = useState(""); // separate email input
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Send OTP to provided email

const requestOtp = async () => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setMessage("❌ Invalid email format");
    return;
  }

  try {
    setLoading(true);

    const data = await apiFetch("api/chats/forgot-chat-pin", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    setMessage(data.message || "OTP sent");
    setOtpSent(true);
  } catch (err) {
    console.error("Error requesting chat pin OTP:", err);
    setMessage("❌ Error sending OTP");
  } finally {
    setLoading(false);
  }
};

// Reset PIN after entering OTP
const resetPin = async () => {
  if (!/^\d{6}$/.test(otp)) {
    setMessage("❌ OTP must be 6 digits");
    return;
  }
  if (!/^\d{4}$/.test(newPin)) {
    setMessage("❌ PIN must be 4 digits");
    return;
  }

  try {
    setLoading(true);

    const data = await apiFetch("api/chats/reset-chat-pin", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPin }),
    });

    setMessage(data.message);

    // ✅ Clear state on success
    setOtp("");
    setNewPin("");
    setOtpSent(false);
    setEmail("");
    onClose(); // close modal
  } catch (err) {
    console.error("Error resetting chat pin:", err);
    setMessage("❌ Error resetting PIN");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="forgot-pin-modal">
      <h3>Forgot Chat PIN</h3>

      {!otpSent ? (
        <>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={requestOtp} disabled={loading || !email}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
          />
          <input
            type="password"
            placeholder="Enter new 4-digit PIN"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            maxLength={4}
          />
          <button onClick={resetPin} disabled={loading}>
            {loading ? "Resetting..." : "Reset PIN"}
          </button>
        </>
      )}

      <button onClick={onClose} className="close-btn" disabled={loading}>
        Close
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
