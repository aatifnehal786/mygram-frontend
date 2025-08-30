import { useState, useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";

export default function SetChatPin({ onSetPin }) {
  const { loggedUser } = useContext(UserContext);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
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
        setHasPin(res.ok && data.hasPin);
        if (res.ok && data.hasPin) setMessage("✅ You already set a chat PIN.");
      } catch (err) {
        console.error(err);
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
        body: JSON.stringify({ userId: loggedUser?.userid, pin }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ ${data.msg}`);
        setPin("");
        setHasPin(true);
        if (onSetPin) onSetPin(); // notify parent
      } else {
        setMessage(`❌ ${data.msg}`);
      }
    } catch {
      setMessage("❌ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (hasPin) return null; // hide form if PIN already exists

  return (
    <div className="set-chat-pin-container">
      <h2>Set Chat PIN</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter 4-digit PIN"
          maxLength={4}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Set PIN"}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
