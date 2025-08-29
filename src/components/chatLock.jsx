import React, { useState, useContext } from "react";
import { UserContext } from "../contexts/UserContext";

function ChatLock({ onUnlock, onRemovePin }) {
  const { loggedUser } = useContext(UserContext);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://mygram-1-1nua.onrender.com/verify-chat-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedUser.userid, pin }),
      });

      const data = await res.json();
      if (res.ok) {
        onUnlock(); // ✅ unlock chat
      } else {
        setMessage(data.message || "Invalid PIN");
      }
    } catch {
      setMessage("Error verifying PIN");
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div className="set-chat-pin-container">
      <input
        type="password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Enter PIN"
      />
      <div className="button-group">
        <button onClick={handleVerify} disabled={loading}>
          {loading ? "Verifying..." : "Unlock"}
        </button>
        
      </div>
      {message && <p>{message}</p>}
    </div>
  );
}

export default ChatLock;
