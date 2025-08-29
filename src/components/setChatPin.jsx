import { useState, useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";

export default function SetChatPin({ onSetPin, onRemovePin, isLocked }) {
  const { loggedUser } = useContext(UserContext);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPin, setHasPin] = useState(false); // ✅ track if PIN is already set

  useEffect(() => {
    // Check if user already has a chat PIN
    const checkPin = async () => {
      try {
        const res = await fetch("https://mygram-1-1nua.onrender.com/check-chat-pin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${loggedUser?.token}`,
          },
          body: JSON.stringify({ userId: loggedUser?.userid }),
        });

        const data = await res.json();
        if (res.ok && data.hasPin) {
          setHasPin(true);
          setMessage("✅ You already set a chat PIN.");
        } else {
          setHasPin(false);
        }
      } catch (err) {
        console.error("Error checking PIN:", err);
      }
    };

    if (loggedUser?.userid) checkPin();
  }, [loggedUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{4}$/.test(pin)) {
      setMessage("❌ PIN must be exactly 4 digits");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("https://mygram-1-1nua.onrender.com/set-chat-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loggedUser?.token}`,
        },
        body: JSON.stringify({
          userId: loggedUser?.userid,
          pin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`❌ ${data.msg}`);
      } else {
        setMessage(`✅ ${data.msg}`);
        setPin("");
        setHasPin(true); // ✅ now PIN exists
        if (onSetPin) onSetPin(); // tell parent ChatPage
      }
    } catch (err) {
      setMessage("❌ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePin = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://mygram-1-1nua.onrender.com/remove-chat-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedUser.userid }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Chat lock removed successfully.");
        localStorage.removeItem("chatUnlocked");
        localStorage.removeItem("chatIsLocked");
        if (onRemovePin) onRemovePin(); // notify parent
      } else {
        setMessage(data.message);
      }
    } catch {
      setMessage("Error removing chat lock.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="set-chat-pin-container">
      <h2>Chat PIN Settings</h2>

      {hasPin ? (
        <div>
          <p className="pin-message">✅ You already set your chat PIN.</p>
          <button onClick={handleRemovePin} disabled={isLocked || loading}>
            {loading ? "Removing..." : "Remove Chat Lock"}
          </button>
          {isLocked && <p>🔒 You must unlock chats first before removing the lock.</p>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="set-chat-pin-form">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter 4-digit PIN"
            maxLength={4}
            className="pin-input"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Set PIN"}
          </button>
        </form>
      )}

      {message && <p className="pin-message">{message}</p>}
    </div>
  );
}
