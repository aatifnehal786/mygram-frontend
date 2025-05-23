import React, { useState } from 'react';
import ChatSidebar from './ChatSideBar';
import ChatWindow from './ChatWindow';
import './chat.css';

const ChatWrapper = () => {
  const [selectedUser, setSelectedUser] = useState(null);

  const handleBack = () => setSelectedUser(null);

  return (
    <div className="chat-wrapper">
      <div className={`chat-sidebar-container ${selectedUser ? 'hide-on-mobile' : ''}`}>
        <ChatSidebar
          onSelectUser={(user) => setSelectedUser(user)}
          selectedUserId={selectedUser?._id}
        />
      </div>
      <div className={`chat-window-container ${!selectedUser ? 'hide-on-mobile' : ''}`}>
        {selectedUser && (
          <>
            <button onClick={handleBack} className="back-button">← Back</button>
            <ChatWindow selectedUser={selectedUser} />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatWrapper;
