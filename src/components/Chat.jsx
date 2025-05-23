import React, { useState } from 'react';
import ChatSidebar from './ChatSideBar';
import ChatWindow from './ChatWindow';
import './chat.css';

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="chat-wrapper">
     <ChatSidebar
  onSelectUser={(user) => setSelectedUser(user)}
  selectedUserId={selectedUser?._id}
/>

      <ChatWindow selectedUser={selectedUser} />
    </div>
  );
};

export default Chat;
