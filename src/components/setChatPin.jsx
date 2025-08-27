import React, { useState } from "react";
import "./Chat.css"; // separate CSS

function SetChatPin({ userId }) {
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");

  const handleSetPin = async () => {
    if (!/^\d{4}$/.test(pin)) {
      setMessage("PIN must be exactly 4 digits");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/set-chat-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pin }),
      });

      const data = await res.json();
      setMessage(data.msg);
      
    } catch (err) {
      setMessage("Server error. Try again.");
    }
  };

  return (
    <div className="chat-lock-container">
      <h2>Set Chat PIN</h2>
      <input
        type="password"
        maxLength="4"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Enter 4-digit PIN"
        className="chat-lock-input"
      />
      <button onClick={handleSetPin} className="chat-lock-button">Save PIN</button>
      {message && <p className="chat-lock-message">{message}</p>}
    </div>
  );
}

export default SetChatPin;
