// ChatLock.jsx
import React, { useState, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import ForgotChatPin from "./forgotChatPin";

function ChatLock({ onUnlock }) {
  const { loggedUser } = useContext(UserContext);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleVerify = async () => {
    if (!/^\d{4}$/.test(pin)) {
      setMessage("❌ PIN must be 4 digits");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("https://mygram-1-1nua.onrender.com/verify-chat-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedUser.userid, pin }),
      });
      const data = await res.json();

      if (res.ok) {
        onUnlock(); // unlock chat
      } else {
        setMessage(data.message || "Invalid PIN");
      }
    } catch {
      setMessage("❌ Error verifying PIN");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="set-chat-pin-container">
      <input
        type="password"
        placeholder="Enter PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        className="pin-input"
        maxLength={4}
      />
      <button onClick={handleVerify} disabled={loading}>
        {loading ? "Verifying..." : "Unlock"}
      </button>
      <button
        className="forgot-pin-btn"
        onClick={() => setShowForgot(true)}
        disabled={loading}
      >
        Forgot PIN?
      </button>

      {message && <p>{message}</p>}

      {showForgot && (
        <ForgotChatPin
          onClose={() => setShowForgot(false)}
        />
      )}
    </div>
  );
}

export default ChatLock;
