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
  const loggedUser = useUserStore((s) => s.loggedUser);
  const { theme } = useTheme();
  const { selectedUser, setSelectedUser, followedUsers, setFollowedUsers, updateUnreadCount, updateLastMessage, isForwarding, messageToForward, setForwardMode } = useChatStore();

  useEffect(() => {
    if (!socket) return;
    const handleReceiveMessage = (msg) => {
      const { selectedUser: currentSelected, addMessage } = useChatStore.getState();
      const loggedId = loggedUser?.userid;
      const senderId = msg.sender?._id || msg.sender;
      const receiverId = msg.receiver?._id || msg.receiver;
      const otherUserId = senderId === loggedId? receiverId : senderId;
      const isCurrentChat = currentSelected && ((senderId === loggedId && receiverId === currentSelected._id) || (receiverId === loggedId && senderId === currentSelected._id));
      if (isCurrentChat) addMessage(msg);
      updateLastMessage(otherUserId, msg);
    };
    socket.on("receiveMessage", handleReceiveMessage);
    return () => socket.off("receiveMessage", handleReceiveMessage);
  }, [socket, loggedUser?.userid, updateLastMessage]);

  useEffect(() => {
    if (!loggedUser?.token) return;
    apiFetch(`api/follow/followers/${loggedUser.userid}`).then(data => setFollowedUsers(data.followers || [])).catch(()=>{});
  }, [loggedUser?.token, loggedUser?.userid, setFollowedUsers]);

  useEffect(() => {
    if (!socket) return;
    const h = (data) => updateUnreadCount(data.senderId, data.unreadCount);
    socket.on("unreadCountUpdated", h);
    return () => socket.off("unreadCountUpdated", h);
  }, [socket, updateUnreadCount]);

  const forwardMessageToUsers = async (msg, receiverIds) => {
    const receivers = Array.isArray(receiverIds)? receiverIds : [receiverIds];
    setForwardMode(true, msg);
    try {
      for (const receiverId of receivers) {
        if (receiverId === loggedUser.userid) continue;
        const newMsg = await apiFetch("api/chats/chat/forward", {
          method: "POST", body: JSON.stringify({ senderId: loggedUser.userid, receiverId, message: msg.message || "", fileUrl: msg.fileUrl || null, fileType: msg.fileType || null, isForwarded: true }),
        });
        if (selectedUser?._id === receiverId) useChatStore.getState().addMessage(newMsg);
      }
    } finally { setForwardMode(false, null); }
  };

  if (loggedUser?.user?.isGuest) {
    return <div className="flex h-[calc(100vh-60px)] items-center justify-center"><div className="text-center"><h2 className="text-xl font-bold">Messages are for logged in users</h2><p className="text-sm text-gray-500 mt-2">Sign up to chat with friends</p></div></div>;
  }

  return (
    <div className={`flex h-[calc(100vh-60px)] md:h-[calc(100vh-60px)] w-full bg-white dark:bg-black ${theme === "dark"? "bg-black border-zinc-800" : "bg-white border-gray-200"}`}>
      <div className={`w-[320px] min-w-[320px] border-r flex-col ${theme === "dark"? "border-zinc-800" : "border-gray-200"} ${selectedUser? "hidden md:flex" : "flex"}`}>
        <ChatSidebar theme={theme} onSelectForwardUser={(ids) => { if (!ids.length) setForwardMode(false, null); else forwardMessageToUsers(messageToForward, ids); }} />
      </div>
      <div className={`flex-1 ${selectedUser? "flex" : "hidden md:flex"} ${theme === "dark"? "bg-black" : "bg-white"}`}>
        {selectedUser? <ChatWindow onBack={() => setSelectedUser(null)} theme={theme} /> : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <div className="w-24 h-24 border-2 rounded-full flex items-center justify-center text-3xl">✈</div>
            <h2 className="text-xl">Your messages</h2>
            <p className="text-sm text-gray-500">Send private photos and messages to a friend or group</p>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};
export default Chat;