import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from "../api/apiFetch";
import './chat.css';
import { getSocket } from "../contexts/SocketContext";
import { FaVideo, FaEllipsisV, FaArrowLeft } from 'react-icons/fa';
import useVideoCallStore from "../store/VideoCallStore"
import EmojiPicker from "emoji-picker-react";
import { VscReactions } from "react-icons/vsc";
import useChatStore from "../store/chatStore";
import useUserStore from '../store/useUserStore';
import usePresenceStore from "../store/usePresenceStore";

const REACTIONS = ["❤", "😂", "😮", "😢", "👍", "👎"];

const ChatWindow = ({ triggerForwardMode, onBack, theme }) => {
  const loggedUser = useUserStore((s) => s.loggedUser);
  const socket = getSocket();
  const currentUserId = loggedUser?.userid;

  const [input, setInput] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionPickerFor, setReactionPickerFor] = useState(null);

  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);
  const chatBtn = useRef(null);
  const inputRef = useRef(null);
  const handleReactionRef = useRef(null);
  const typingTimeout = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const chatContainerRef = useRef(null);

  const { selectedUser, messages, setMessages, markMessagesSeen, updateMessages } = useChatStore();
  const { onlineUsers } = usePresenceStore();
  const isUserOnline = onlineUsers.some(id => id.toString() === selectedUser._id.toString());

  const [skip, setSkip] = useState(0);
  const [limit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // --- PAGINATION ---
  const loadMessages = async (initial = false) => {
    if (loadingMore || (!hasMore &&!initial) ||!selectedUser) return;
    setLoadingMore(true);
    const prevScrollHeight = chatContainerRef.current?.scrollHeight || 0;
    try {
      const currentSkip = initial? 0 : skip;
      const data = await apiFetch(`api/chats/chat/${selectedUser._id}?limit=${limit}&skip=${currentSkip}`);
      if (!Array.isArray(data)) return;
      if (data.length < limit) setHasMore(false);
      if (initial) {
        setMessages(data);
        setSkip(data.length);
      } else {
        setMessages((prev) => [...data,...prev]);
        setSkip((p) => p + data.length);
      }
      requestAnimationFrame(() => {
        if (initial) chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
        else if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight - prevScrollHeight;
        }
      });
    } finally { setLoadingMore(false); }
  };

  useEffect(() => {
    if (selectedUser) {
      setHasMore(true);
      setSkip(0);
      setMessages([]);
      loadMessages(true);
      setIsTyping(false);
    }
  }, [selectedUser?._id]);

  // --- SCROLL HANDLER FOR PAGINATION ---
  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 100;
    if (el.scrollTop < 50 && hasMore &&!loadingMore) loadMessages(false);
  };

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- SOCKET: REACTION ---
  useEffect(() => {
    if (!socket) return;
    const handleReaction = ({ messageId, reactions }) => {
      updateMessages((prev) => prev.map((m) => m._id === messageId? {...m, reactions } : m));
    };
    socket.on("message-reaction", handleReaction);
    return () => socket.off("message-reaction", handleReaction);
  }, [socket]);

  // --- SOCKET: TYPING - FIXED (removed input dep) ---
  useEffect(() => {
    if (!socket ||!selectedUser) return;
    const handleTyping = (senderId) => { if (senderId === selectedUser._id) setIsTyping(true); };
    const handleStopTyping = (senderId) => { if (senderId === selectedUser._id) setIsTyping(false); };
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket, selectedUser?._id]);

  // --- SOCKET: SEEN ---
  useEffect(() => {
    if (!socket ||!selectedUser) return;
    socket.emit("chatOpen", { chattingWith: selectedUser._id });
    socket.emit("markSeen", { userId: currentUserId, otherUserId: selectedUser._id });
    return () => { socket.emit("chatClose", { chattingWith: selectedUser._id }); };
  }, [selectedUser?._id, socket, currentUserId]);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ userId }) => markMessagesSeen(userId, currentUserId);
    socket.on("messagesSeen", handler);
    return () => socket.off("messagesSeen", handler);
  }, [socket, currentUserId]);

  // --- DELETE LISTENERS ---
  useEffect(() => {
    if (!socket) return;
    const handleDeleteEveryone = ({ messageId }) => {
      updateMessages((prev) => prev.map((m) => m._id === messageId? {...m, isDeleted: true } : m));
    };
    socket.on("messageDeleted", handleDeleteEveryone);
    return () => socket.off("messageDeleted", handleDeleteEveryone);
  }, [socket]);

  // --- UI HELPERS ---
  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit('sendMessage', { senderId: currentUserId, receiverId: selectedUser._id, message: input.trim() });
    setInput('');
  };

  const handleTypingLogic = (text) => {
    setInput(text);
    if (!socket ||!selectedUser) return;
    if (text.length > 0) socket.emit("typing", { senderId: currentUserId, receiverId: selectedUser._id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", { senderId: currentUserId, receiverId: selectedUser._id });
    }, 1000);
  };

  const handleVideoCall = () => {
    if (!selectedUser ||!isUserOnline) { alert("User is offline"); return; }
    useVideoCallStore.getState().initiateCall(selectedUser._id, selectedUser.username, selectedUser.profilePic, "video");
  };

  //... keep your other helpers: copyMessageToInput, handleEmojiClick, handleFileUpload, deleteMessageForMe, deleteMessageForEveryone, renderMessageWithLinks, etc...

  return (
    // your same JSX but WITHOUT <VideoCallManager />
    // I kept your header logic which is already correct
    <>
      <div className={`flex-1 w-full flex flex-col h-full ${theme === 'dark'? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`flex gap-3 px-4 py-3 border-b ${theme === 'dark'? 'bg-gray-700' : 'bg-white'} sticky top-0 z-10`}>
          <button onClick={onBack} className="md:hidden text-xl"><FaArrowLeft /></button>
          <div className="ml-3 flex-grow">
            <h3 className="text-sm font-medium">{selectedUser.username}</h3>
            <p className="text-xs text-gray-500">{isTyping? "typing..." : isUserOnline? "Online" : "Offline"}</p>
          </div>
          <button onClick={handleVideoCall}><FaVideo className={`h-5 w-5 ${isUserOnline? "text-green-500" : "text-gray-400"}`} /></button>
        </div>

        <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loadingMore && <p className="text-center text-xs">Loading...</p>}
          {messages.map((msg) => {
            const senderId = msg.sender?._id || msg.sender;
            const isOwn = senderId === currentUserId;
            if (msg.deletedFor?.some(id => id.toString() === currentUserId)) return null;
            return (
              <div key={msg._id} className={`flex ${isOwn? "justify-end" : "justify-start"}`}>
                <div className={`relative max-w-[75%] rounded-xl px-3 py-2 text-sm ${isOwn? "bg-green-600 text-white" : "bg-white border"}`}>
                  {msg.isDeleted? <p className="italic text-gray-400">🗑 Deleted</p> : <p className="whitespace-pre-wrap break-words">{msg.message}</p>}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex items-center gap-2 px-3 py-2 border-t bg-white">
          <input ref={inputRef} value={input} onChange={(e) => handleTypingLogic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && chatBtn.current?.click()} placeholder="Type a message..." className="flex-1 px-4 py-2 rounded-full border text-sm" />
          <button ref={chatBtn} onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-full">Send</button>
        </div>
      </div>
    </>
  );
};

export default ChatWindow;