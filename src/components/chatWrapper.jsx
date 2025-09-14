import React, { useState, useEffect, useContext } from "react";
import ChatLock from "./chatLock";
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
  // Check if user already has a PIN
useEffect(() => {
  const checkPin = async () => {
    try {
      const data = await apiFetch("/check-chat-pin", {
        method: "POST",
        body: JSON.stringify({ userId: loggedUser?.userid }),
      });

      setHasPin(data.hasPin);
    } catch (err) {
      console.error("Failed to check chat PIN:", err.message);
    }
  };

  if (loggedUser?.userid) checkPin();
}, [loggedUser]);

  const handleUnlock = () => setUnlocked(true);
  const handleLock = () => setUnlocked(false);
const handleRemovePin = async () => {
  try {
    const data = await apiFetch("/remove-chat-pin", {
      method: "POST",
      body: JSON.stringify({ userId: loggedUser.userid }),
    });

    // If apiFetch succeeds, we assume PIN is removed
    setHasPin(false);
    setUnlocked(false); // auto-lock after removing PIN
    localStorage.setItem("chatUnlocked", "false");
  } catch (err) {
    console.error("Failed to remove chat PIN:", err.message);
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
