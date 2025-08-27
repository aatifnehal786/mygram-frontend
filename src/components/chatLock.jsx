import React, { useState } from "react";
import "./Chat.css";

function ChatLock({ userId, onUnlock }) {
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");

  const handleVerify = async () => {
    try {
      const res = await fetch("http://localhost:8000/verify-chat-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pin }),
      });

      const data = await res.json();
      setMessage(data.msg);

      if (res.ok) {
        onUnlock(); // 🔓 unlock chat
      }
    } catch (err) {
      setMessage("Server error. Try again.");
    }
  };

  return (
    <div className="chat-lock-container">
      <h2>Enter Chat PIN</h2>
      <input
        type="password"
        maxLength="4"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Enter 4-digit PIN"
        className="chat-lock-input"
      />
      <button onClick={handleVerify} className="chat-lock-button">
        Unlock
      </button>
      {message && <p className="chat-lock-message">{message}</p>}
    </div>
  );
}

export default ChatLock;
