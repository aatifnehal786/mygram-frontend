import React, { useEffect, useState } from 'react';
import ChatSidebar from './ChatSideBar';
import ChatWindow from './ChatWindow';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiFetch } from '../api/apiFetch';
import { useTheme } from '../contexts/ThemeContext';
import { getSocket } from "../contexts/SocketContext";
import useChatStore from "../store/chatStore";
import useUserStore from '../store/useUserStore';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
const socket = getSocket();
const loggedUser = useUserStore((s) => s.loggedUser);
const { theme } = useTheme();

const [showForwardModal, setShowForwardModal] = useState(false);
const [forwardMessageData, setForwardMessageData] = useState(null);
const [selectedForwardUsers, setSelectedForwardUsers] = useState([]);
const [searchForward, setSearchForward] = useState('');
const navigate = useNavigate();

const isGuest = loggedUser?.user?.isGuest;

// In store
const { selectedUser, setSelectedUser, followedUsers, setFollowedUsers, updateUnreadCount, updateLastMessage } = useChatStore();


  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      // ✅ NO HOOK HERE - use getState()
      const { selectedUser: currentSelected, addMessage } = useChatStore.getState();
      const { loggedUser: currentLoggedUser } = useUserStore.getState(); // or use loggedUser from closure
      
      const loggedId = currentLoggedUser?.userid || currentLoggedUser?.user?._id;
      const senderId = msg.sender?._id || msg.sender;
      const receiverId = msg.receiver?._id || msg.receiver;
      const otherUserId = senderId === loggedId ? receiverId : senderId;

      const isCurrentChat = currentSelected && (
        (senderId === loggedId && receiverId === currentSelected._id) || 
        (receiverId === loggedId && senderId === currentSelected._id)
      );
      
      if (isCurrentChat) addMessage(msg);
      updateLastMessage(otherUserId, msg);
    };

    socket.on("receiveMessage", handleReceiveMessage);
    return () => socket.off("receiveMessage", handleReceiveMessage);
  }, [socket, updateLastMessage]); // remove loggedUser?.userid from deps


  useEffect(() => {
  if (!socket) return;

  const handleRateLimit = (data) => {
    // show same toast you made earlier
    window.dispatchEvent(new CustomEvent('rate-limit-error', { detail: data.message }));
  };

  socket.on("rate-limit-error", handleRateLimit);

  return () => socket.off("rate-limit-error", handleRateLimit);
}, [socket]);



  // BLOCK GUEST - redirect to login
  useEffect(() => {
    if (isGuest) {
      toast.error("Please login to access messages");
      navigate("/home");
    }
  }, [isGuest]);

  useEffect(() => {
  if (!loggedUser?.token) return;
  if (loggedUser?.user?.isGuest) {
    setFollowedUsers([]); // guest gets empty
    return;
  }
  apiFetch(`api/user/followers/${loggedUser.userid}`)
   .then(data => {
      console.log("followers data:", data);
      // ensure ALWAYS array
      const arr = data?.followers || data?.users || data || [];
      setFollowedUsers(Array.isArray(arr)? arr : []);
    })
   .catch(err => {
      console.error("Followers fetch failed", err);
      setFollowedUsers([]); // fallback to empty array
    });
}, [loggedUser?.token, loggedUser?.userid]);

  useEffect(() => {
    if (!socket) return;
    const h = (data) => updateUnreadCount(data.senderId, data.unreadCount);
    socket.on("unreadCountUpdated", h);
    return () => socket.off("unreadCountUpdated", h);
  }, [socket, updateUnreadCount]);

  // THIS WAS MISSING - TRIGGER FROM CHATWINDOW
    const triggerForwardMode = (msg) => {
    setForwardMessageData(msg);
    setShowForwardModal(true);
    setSelectedForwardUsers([]);
  };

  const forwardMessageToUsers = async () => {
    if (!forwardMessageData || selectedForwardUsers.length === 0) return;
    for (const receiverId of selectedForwardUsers) {
      if (receiverId === loggedUser.userid) continue;
      try {
        const payload = {
          senderId: loggedUser.userid,
          receiverId,
          message: forwardMessageData.message || forwardMessageData.content || "",
          fileUrl: forwardMessageData.fileUrl || forwardMessageData.imageOrVideoUrl || null,
          fileType: forwardMessageData.fileType || null,
          isForwarded: true,
        };
        await apiFetch("api/chats/chat/forward", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        socket.emit("sendMessage", { ...payload });
      } catch (e) { console.error(e); }
    }
    setShowForwardModal(false);
    setForwardMessageData(null);
    setSelectedForwardUsers([]);
    alert(`Forwarded to ${selectedForwardUsers.length} users`);
  };

  // Filter for forward modal
const safeFollowedUsers = Array.isArray(followedUsers)? followedUsers : [];

const filteredForwardUsers = safeFollowedUsers.filter(u =>
  u.username?.toLowerCase().includes(searchForward.toLowerCase())
);



  if (loggedUser?.user?.isGuest) {
    return (<div className="flex h-[calc(100vh-60px)] items-center justify-center"><div className="text-center"><h2 className="text-xl font-bold">Messages are for logged in users</h2><p className="text-sm text-gray-500 mt-2">Sign up to chat with friends</p></div></div>);
  }

  return (
   <div className={`flex h-[calc(100vh-60px)] w-full max-w- mx-auto border-x ${theme === "dark" ? "border-[#374045] bg-[#111B21]" : "border-gray-200 bg-[#ECE5DD]"}`}>
  
  {/* LEFT - Sidebar */}
  <div className={`${selectedUser ? "hidden md:flex" : "flex"} w-full md:max-w- md:min-w- border-r flex-col ${theme === "dark" ? "border-[#374045] bg-[#202C33]" : "border-gray-200 bg-white"}`}>
    <ChatSidebar theme={theme} />
  </div>

  {/* RIGHT - Chat Window / Empty State */}
  <div className={`${selectedUser ? "flex" : "hidden md:flex"} flex-1 flex-col bg-[#ECE5DD] dark:bg-[#0B141A] wa-chat-bg`}>
    {selectedUser ? (
      <ChatWindow 
        onBack={() => setSelectedUser(null)} 
        theme={theme} 
        triggerForwardMode={triggerForwardMode} 
      />
    ) : (
      <div className="flex-1 flex items-center justify-center flex-col gap-3 px-6 text-center">
        {/* WhatsApp Empty State */}
        <div className="w- h- rounded-full bg-[#DCF8C6] dark:bg-[#005C4B] flex items-center justify-center text- mb-2">
          💬
        </div>
        <p className="font-bold text- text-[#111B21] dark:text-white">WhatsApp Web</p>
        <p className="text-sm text-[#8696A0] max-w- leading-5">
          Now send and receive messages without keeping your phone online.<br />
          Select a chat to start messaging.
        </p>
        <div className="w- h- bg-[#D1D7DB] dark:bg-[#374045] my-2" />
        <p className="text- text-[#8696A0] flex items-center gap-1">
          🔒 End-to-end encrypted • MyGram Chat
        </p>
        <button
          onClick={() => document.querySelector('input[placeholder="Search"]')?.focus()}
          className="mt-2 bg-[#25D366] hover:bg-[#1EBE5A] text-white px-6 py-2.5 rounded-full text-sm font-semibold transition"
        >
          Start New Chat
        </button>
      </div>
    )}
  </div>

  {/* FORWARD MODAL - WhatsApp Style */}
  {showForwardModal && (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className={`w-full max-w- rounded-xl ${theme === "dark" ? "bg-[#202C33]" : "bg-white"} p-0 max-h- flex flex-col overflow-hidden shadow-2xl`}>
        <div className={`flex justify-between items-center p-4 ${theme === "dark" ? "bg-[#202C33] border-[#374045]" : "bg-[#075E54] text-white"} border-b`}>
          <h3 className="font-semibold">Forward to</h3>
          <button onClick={() => setShowForwardModal(false)} className="text-xl w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center">×</button>
        </div>

        <div className="p-3">
          <input 
            value={searchForward} 
            onChange={e => setSearchForward(e.target.value)}
            placeholder="Search"
            className={`w-full rounded-full px-4 py-2.5 text-sm outline-none ${theme === 'dark' ? 'bg-[#2A3942] text-white placeholder:text-[#8696A0] focus:ring-2 focus:ring-[#25D366]/30' : 'bg-[#F0F2F5] focus:ring-2 focus:ring-[#25D366]/30'}`}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredForwardUsers.length === 0 ? (
            <p className="text-xs text-[#8696A0] text-center py-8">No users found. Follow someone to forward.</p>
          ) : filteredForwardUsers.filter(u => u._id !== (loggedUser.userid || loggedUser._id)).map(u => (
            <label key={u._id} className="flex items-center gap-3 p-3 hover:bg-[#F0F2F5] dark:hover:bg-[#2A3942] rounded-lg cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedForwardUsers.includes(u._id)}
                onChange={(e) => {
                  if (e.target.checked) setSelectedForwardUsers(prev => [...prev, u._id]);
                  else setSelectedForwardUsers(prev => prev.filter(id => id !== u._id));
                }}
                className="w-4 h-4 accent-[#25D366]"
              />
              <img src={u.profilePic || u.profilePicture || "/placeholder.svg"} className="w-10 h-10 rounded-full object-cover border-2 border-[#25D366]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{u.username}</p>
                <p className="text-xs text-[#8696A0]">Tap to select</p>
              </div>
              {selectedForwardUsers.includes(u._id) && (
                <span className="w-6 h-6 bg-[#25D366] text-white rounded-full flex items-center justify-center text-xs">✓</span>
              )}
            </label>
          ))}
        </div>

        <div className={`p-4 border-t ${theme === "dark" ? "border-[#374045] bg-[#202C33]" : "border-gray-200 bg-[#F0F2F5]"}`}>
          <button 
            onClick={forwardMessageToUsers} 
            disabled={selectedForwardUsers.length === 0}
            className="w-full bg-[#25D366] hover:bg-[#1EBE5A] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-full font-semibold text-sm transition"
          >
            Send ({selectedForwardUsers.length})
          </button>
        </div>
      </div>
    </div>
  )}
  <ToastContainer />
</div>
  );
};
export default Chat;