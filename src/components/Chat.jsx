// ✅ Chat.jsx - FIXED
import React, { useEffect } from 'react';
import ChatSidebar from './ChatSideBar';
import ChatWindow from './ChatWindow';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiFetch } from '../api/apiFetch';
import './chat.css';
import { useTheme } from '../contexts/ThemeContext';
import { getSocket } from "../contexts/SocketContext";
import useChatStore from "../store/chatStore";
import useUserStore from '../store/useUserStore';

const Chat = () => {
  const socket = getSocket();
  const loggedUser = useUserStore((state) => state.loggedUser);
  const { theme } = useTheme();

  const {
    selectedUser,
    setSelectedUser,
    setMessages,
    followedUsers,
    setFollowedUsers,
    updateUnreadCount,
    updateLastMessage,
    isForwarding,
    messageToForward,
    setForwardMode,
  } = useChatStore();



  // 2. GLOBAL socket listener - runs ONCE, no selectedUser dependency
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      // Get fresh state inside handler, not from closure
      const { selectedUser: currentSelected, addMessage } = useChatStore.getState();
      const loggedId = loggedUser?.userid || loggedUser?._id;

      const senderId = msg.sender?._id || msg.sender;
      const receiverId = msg.receiver?._id || msg.receiver;

      const otherUserId = senderId === loggedId? receiverId : senderId;

      // Check if this message is for currently open chat
      const isCurrentChat = currentSelected && (
        (senderId === loggedId && receiverId === currentSelected._id) ||
        (receiverId === loggedId && senderId === currentSelected._id)
      );

      if (isCurrentChat) {
        addMessage(msg); // store has de-duplication by _id
      }

      updateLastMessage(otherUserId, msg);
    };

    socket.on("receiveMessage", handleReceiveMessage);
    return () => socket.off("receiveMessage", handleReceiveMessage);
  }, [socket, loggedUser?.userid, loggedUser?._id, updateLastMessage]);

  // 3. Followed users
  useEffect(() => {
    if (!loggedUser?.token) return;
    const fetchFollowedUsers = async () => {
      try {
        const data = await apiFetch(`api/followers/${loggedUser.userid}`);
        setFollowedUsers(data.followers || []);
      } catch (err) {
        console.error("Error fetching followed users:", err.message);
      }
    };
    fetchFollowedUsers();
  }, [loggedUser?.token, loggedUser?.userid, setFollowedUsers]);

  // 4. Unread count
  useEffect(() => {
    if (!socket) return;
    const handleUnreadUpdate = (data) => {
      updateUnreadCount(data.senderId, data.unreadCount);
    };
    socket.on("unreadCountUpdated", handleUnreadUpdate);
    return () => socket.off("unreadCountUpdated", handleUnreadUpdate);
  }, [socket, updateUnreadCount]);

  const forwardMessageToUsers = async (msg, receiverIds) => {
    const receivers = Array.isArray(receiverIds)? receiverIds : [receiverIds];
    setForwardMode(true, msg);
    try {
      for (const receiverId of receivers) {
        if (receiverId === loggedUser.userid) continue;
        const newMsg = await apiFetch("api/chats/chat/forward", {
          method: "POST",
          body: JSON.stringify({
            senderId: loggedUser.userid,
            receiverId,
            message: msg.message || "",
            fileUrl: msg.fileUrl || null,
            fileType: msg.fileType || null,
            isForwarded: true,
          }),
        });
        if (selectedUser?._id === receiverId) {
          useChatStore.getState().addMessage(newMsg);
        }
      }
      alert("Message forwarded successfully.");
    } catch (err) {
      console.error("Forward failed:", err);
      alert("Forwarding failed.");
    } finally {
      setForwardMode(false, null);
    }
  };

  const triggerForwardMode = (msg) => {
    setForwardMode(true, msg);
    setSelectedUser(null);
  };

  return (
    loggedUser?.user?.isGuest? (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <h2 className="text-2xl font-bold mb-3">Chat is unavailable</h2>
          <p className="text-gray-600 mb-6">Please sign up or log in to send and receive messages.</p>
        </div>
      </div>
    ) : (
      <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
        <div className={`w-full md:w-1/3 lg:w-1/4 bg-white border-r transition-all ${selectedUser? "hidden md:block" : "block"}`}>
          <ChatSidebar
            onSelectUser={(user) => { if (!isForwarding) setSelectedUser(user); }}
            followedUsers={followedUsers}
            selectedUserId={selectedUser?._id}
            isForwarding={isForwarding}
            onSelectForwardUser={(userIds) => {
              if (userIds.length === 0) setForwardMode(false, null);
              else forwardMessageToUsers(messageToForward, userIds);
            }}
            theme={theme}
          />
        </div>
        <div className={`flex-1 bg-gray-50 ${selectedUser? "block" : "hidden md:block"}`}>
          {selectedUser? (
            <ChatWindow
              selectedUser={selectedUser}
              triggerForwardMode={triggerForwardMode}
              onBack={() => setSelectedUser(null)}
              theme={theme}
            />
          ) : (
            <div className="hidden md:flex h-full items-center justify-center text-gray-400">Select a chat to start messaging</div>
          )}
        </div>
        <ToastContainer position="bottom-right" autoClose={3000} />
      </div>
    )
  );
};

export default Chat;