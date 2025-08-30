import React, { useState } from "react";
import ChatLock from "./ChatLock";
import Chat from "./Chat";
import SetChatPin from "./setChatPin";

function ChatWrapper({ userId }) {
  const [unlocked, setUnlocked] = useState(false);  // true if chat unlocked
  const [hasPin, setHasPin] = useState(true);      // true if PIN exists

  // Unlock chat
  const handleUnlock = () => setUnlocked(true);

  // Lock chat
  const handleLock = () => setUnlocked(false);

  // Remove chat PIN
  const handleRemovePin = () => {
    setHasPin(false);      // remove PIN
    setUnlocked(false);    // auto lock after removing PIN
  };

  // Set new PIN
  const handleSetPin = () => {
    setHasPin(true);
  };

  // PRIORITY RENDER: no PIN -> set PIN -> else unlocked/chatlock
  if (!hasPin) {
    return <SetChatPin onSetPin={handleSetPin} />;
  } else if (unlocked) {
    return (
      <Chat
        onLock={handleLock}
        onRemovePin={handleRemovePin}
        canRemovePin={hasPin}
      />
    );
  } else {
    return <ChatLock onUnlock={handleUnlock} />;
  }
}

export default ChatWrapper;
