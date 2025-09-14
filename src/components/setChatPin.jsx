import { useState, useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";
import { apiFetch } from "../utils/api";
export default function SetChatPin({ onSetPin }) {
  const { loggedUser } = useContext(UserContext);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPin, setHasPin] = useState(false);

   // 🔹 Check if user already has a PIN
useEffect(() => {
  const checkPin = async () => {
    try {
      const data = await apiFetch("/auth/check-chat-pin", {
        method: "POST",
        body: JSON.stringify({ userId: loggedUser?.userid }),
      });

      setHasPin(data.hasPin);
      if (data.hasPin) setMessage("✅ You already set a chat PIN.");
    } catch (err) {
      console.error(err);
    }
  };

  if (loggedUser?.userid) checkPin();
}, [loggedUser]);


  // 🔹 Handle SET PIN
 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!/^\d{4}$/.test(pin)) {
    setMessage("❌ PIN must be exactly 4 digits");
    return;
  }

  try {
    setLoading(true);
    const data = await apiFetch("/auth/set-chat-pin", {
      method: "POST",
      body: JSON.stringify({ userId: loggedUser?.userid, pin }),
    });

    setMessage(`✅ ${data.msg}`);
    setPin("");
    setHasPin(true);
    if (onSetPin) onSetPin(); // notify parent
  } catch (err) {
    setMessage(`❌ ${err.message}`);
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
