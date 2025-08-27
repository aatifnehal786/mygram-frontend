import React, { useState } from "react";
import SetChatPin from "./setChatPin"; // Import SetChatPin component
import ChatLock from "./chatLock"; // Import ChatLock component
import Chat from "./Chat"; // your existing chat component
import './Chat.css'

function ChatPage({ userId }) {
  const [isUnlocked, setIsUnlocked] = useState(false);

  return (
    <>
      {!isUnlocked ? (
        <ChatLock userId={userId} onUnlock={() => setIsUnlocked(true)} />
      ) : (
        <Chat />
      )}

      {/* Show PIN setup form somewhere in settings */}
      <SetChatPin userId={userId} />
    </>
  );
}

export default ChatPage;
