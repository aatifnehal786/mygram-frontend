// ChatWrapper.jsx
import React, { useState } from "react";
import Chat from "./Chat";
import ChatLock from "./chatLock";

const ChatWrapper = ({ userId }) => {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <ChatLock userId={userId} onUnlock={() => setUnlocked(true)} />;
  }

  return <Chat />;
};

export default ChatWrapper;
