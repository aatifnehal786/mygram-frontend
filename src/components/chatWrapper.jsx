import React, { useState, useEffect, useContext } from "react";
import ChatLock from "./ChatLock";
import Chat from "./Chat";
import SetChatPin from "./setChatPin";
import { UserContext } from "../contexts/UserContext";

export default function ChatWrapper({ userId }) {
  const { loggedUser } = useContext(UserContext);
  const [unlocked, setUnlocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  // On mount, read unlocked state from localStorage
  useEffect(() => {
    const storedUnlocked = localStorage.getItem("chatUnlocked");
    if (storedUnlocked === "true") setUnlocked(true);
  }, []);

  // Persist unlocked state in localStorage
  useEffect(() => {
    localStorage.setItem("chatUnlocked", unlocked ? "true" : "false");
  }, [unlocked]);

  // Check if user already has a PIN
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
      } catch (err) {
        console.error(err);
      }
    };
    if (loggedUser?.userid) checkPin();
  }, [loggedUser]);

  const handleUnlock = () => setUnlocked(true);
  const handleLock = () => setUnlocked(false);

  const handleRemovePin = async () => {
    try {
      const res = await fetch("https://mygram-1-1nua.onrender.com/remove-chat-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedUser.userid }),
      });
      const data = await res.json();
      if (res.ok) {
        setHasPin(false);
        setUnlocked(false); // auto-lock after removing PIN
        localStorage.setItem("chatUnlocked", "false");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!hasPin) return <SetChatPin onSetPin={() => setHasPin(true)} />;

  return !unlocked ? (
    <ChatLock onUnlock={handleUnlock} />
  ) : (
    <Chat
      onLock={handleLock}
      canRemovePin={unlocked && hasPin}
      onRemovePin={handleRemovePin}
    />
  );
}
