import React, { useState } from "react";
import SetChatPin from "./setChatPin";
import ChatLock from "./ChatLock";
import Chat from "./Chat";

function ChatWrapper({ userId }) {
  const [unlocked, setUnlocked] = useState(false); // ✅ controls lock/unlock
  const [isLocked, setIsLocked] = useState(true);  // ✅ controls Remove Chat Lock button

  const handleUnlock = () => {
    setUnlocked(true);
    setIsLocked(false); // ✅ unlocked → allow Remove Chat Lock
  };

  const handleLock = () => {
    setUnlocked(false);
    setIsLocked(true); // ✅ locked → disable Remove Chat Lock
  };

  return (
    <>
      {!unlocked ? (
        <ChatLock onUnlock={handleUnlock} />
      ) : (
        <Chat onLock={handleLock} />
      )}

      {/* Pass isLocked to SetChatPin */}
      <SetChatPin isLocked={isLocked} />
    </>
  );
}

export default ChatWrapper;
