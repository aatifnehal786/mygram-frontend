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
  // Replace these 4 lines at top
const [showForwardModal, setShowForwardModal] = useState(false);
const [forwardMessageData, setForwardMessageData] = useState(null);
const [selectedForwardUsers, setSelectedForwardUsers] = useState([]);
const [searchForward, setSearchForward] = useState('');

// In store
const { selectedUser, setSelectedUser, followedUsers, setFollowedUsers, updateUnreadCount, updateLastMessage } = useChatStore();

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
 const navigate = useNavigate();

  const isGuest = loggedUser?.user?.isGuest;

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
  apiFetch(`api/follow/followers/${loggedUser.userid}`)
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
    <div className={`flex h-[calc(100vh-60px)] w-full max-w- mx-auto border ${theme === "dark"? "border-zinc-800 bg-black" : "border-gray-200 bg-white"}`}>
      
      <div className={`${selectedUser? "hidden md:flex" : "flex"} w-100 md:max-w- md:min-w- border-r flex-col ${theme === "dark"? "border-zinc-800 bg-black" : "border-gray-200 bg-white"}`}>
        <ChatSidebar theme={theme} />
      </div>

      <div className={`${selectedUser? "flex" : "hidden md:flex"} flex-1 flex-col`}>
        {selectedUser? (
          <ChatWindow 
            onBack={() => setSelectedUser(null)} 
            theme={theme} 
            triggerForwardMode={triggerForwardMode} 
          />
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-2">
            <div className="w-24 h-24 rounded-full border-2 flex items-center justify-center text-4xl">✈️</div>
            <p className="font-semibold">Your messages</p>
            <p className="text-sm text-gray-400">Send private photos and messages to a friend or group</p>
          </div>
        )}
      </div>

      {/* FORWARD MODAL */}
            {showForwardModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className={`w-full max-w- rounded-xl ${theme === "dark"? "bg-zinc-900" : "bg-white"} p-0 max-h- flex flex-col overflow-hidden`}>
            <div className="flex justify-between items-center p-4 border-b dark:border-zinc-800">
              <h3 className="font-semibold">Forward to</h3>
              <button onClick={() => setShowForwardModal(false)} className="text-xl w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center">×</button>
            </div>

            <div className="p-3">
              <input 
                value={searchForward} 
                onChange={e => setSearchForward(e.target.value)}
                placeholder="Search"
                className={`w-full rounded-full px-4 py-2 text-sm outline-none ${theme === 'dark'? 'bg-zinc-800' : 'bg-gray-100'}`}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filteredForwardUsers.length === 0? (
                <p className="text-xs text-gray-400 text-center py-8">No users found. Follow someone to forward.</p>
              ) : filteredForwardUsers.filter(u => u._id !== (loggedUser.userid || loggedUser._id)).map(u => (
                <label key={u._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedForwardUsers.includes(u._id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedForwardUsers(prev => [...prev, u._id]);
                      else setSelectedForwardUsers(prev => prev.filter(id => id !== u._id));
                    }}
                    className="w-4 h-4"
                  />
                  <img src={u.profilePic || u.profilePicture || "/placeholder.svg"} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.username}</p>
                    <p className="text-xs text-gray-500">Tap to select</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="p-4 border-t dark:border-zinc-800">
              <button 
                onClick={forwardMessageToUsers} 
                disabled={selectedForwardUsers.length === 0}
                className="w-full bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-semibold text-sm"
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