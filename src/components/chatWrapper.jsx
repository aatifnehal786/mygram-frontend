import React, { useState, useEffect, useContext } from "react";
import ChatLock from "./chatLock";
import Chat from "./Chat";
import SetChatPin from "./setChatPin";
import { UserContext } from "../contexts/UserContext";
import { apiFetch } from "../api/apiFetch";

export default function ChatWrapper({ userId }) {
  const { loggedUser } = useContext(UserContext);
  const [unlocked, setUnlocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  // On mount, read unlocked state from localStorage
  useEffect(() => {
    const storedUnlocked = localStorage.getItem("chatUnlocked");
    if (storedUnlocked === "true") setUnlocked(true);
  }, [loggedUser]);



  // Check if user already has a PIN
  // Check if user already has a PIN
useEffect(() => {
  const checkPin = async () => {
    try {
      const data = await apiFetch("api/chats/check-chat-pin", {
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
    const data = await apiFetch("api/chats/remove-chat-pin", {
      method: "POST",
      body: JSON.stringify({ userId: loggedUser.userid }),
    });

    // If apiFetch succeeds, we assume PIN is removed
    setHasPin(false);
   
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
