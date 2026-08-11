import React, { useEffect, useRef, useState, useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { apiFetch } from "../api/apiFetch";
import { getSocket } from "../contexts/SocketContext";
import {
  FaVideo,
  FaArrowLeft,
  FaRegSmile,
  FaPaperclip,
  FaPaperPlane,
  FaTimes,
  FaCheckDouble,
  FaSmile,
} from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { FaTrashAlt, FaRegCopy } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import useChatStore from "../store/chatStore";
import useUserStore from "../store/useUserStore";
import usePresenceStore from "../store/usePresenceStore";
import useVideoCallStore from "../store/VideoCallStore";

// helpers
const isValidDate = (d) => d instanceof Date &&!isNaN(d);
const useOutsideClick = (ref, cb) => {
  useEffect(() => {
    const fn = (e) => { if (ref.current &&!ref.current.contains(e.target)) cb(); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ref, cb]);
};

export default function ChatWindow({ onBack, theme, triggerForwardMode }) {
  const loggedUser = useUserStore((s) => s.loggedUser);
  const socket = getSocket();
  const currentUserId = loggedUser?.userid || loggedUser?._id;
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showEmojiForMsg, setShowEmojiForMsg] = useState(null);
  const [showReactionsFor, setShowReactionsFor] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [deleteMode, setDeleteMode] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const dropdownRef = useRef(null);
  const emojiRef = useRef(null);
  const reactionRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);

  const { selectedUser, messages, setMessages, markMessagesSeen, addReaction } = useChatStore();
  const { onlineUsers } = usePresenceStore();
  const isUserOnline = onlineUsers.some((id) => id.toString() === selectedUser._id.toString());
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useOutsideClick(emojiRef, () => setShowEmoji(false));
  useOutsideClick(reactionRef, () => setShowReactionsFor(null));
  useOutsideClick(dropdownRef, () => setOpenDropdownId(null));

  useEffect(() => { if (toastMessage) { const t = setTimeout(() => setToastMessage(""), 2500); return () => clearTimeout(t); } }, [toastMessage]);

  // LOAD MESSAGES
  const loadMessages = async (initial = false) => {
    if (loadingMore || (!hasMore &&!initial)) return;
    setLoadingMore(true);
    const prev = chatContainerRef.current?.scrollHeight || 0;
    try {
      const data = await apiFetch(`api/chats/chat/${selectedUser._id}?limit=20&skip=${initial? 0 : skip}`);
      if (!Array.isArray(data)) return;
      if (data.length < 20) setHasMore(false);
      if (initial) { setMessages(data); setSkip(data.length); }
      else { setMessages((p) => [...data,...p]); setSkip((p) => p + data.length); if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight - prev; }
    } finally { setLoadingMore(false); }
  };
  useEffect(() => { if (selectedUser) { setHasMore(true); setSkip(0); setMessages([]); loadMessages(true); } }, [selectedUser?._id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // TYPING + SEEN
  useEffect(() => {
    if (!socket ||!selectedUser) return;
    const onTyping = (id) => id === selectedUser._id && setIsTyping(true);
    const offTyping = (id) => id === selectedUser._id && setIsTyping(false);
    socket.on("typing", onTyping); socket.on("stopTyping", offTyping);
    return () => { socket.off("typing", onTyping); socket.off("stopTyping", offTyping); };
  }, [socket, selectedUser?._id]);

  useEffect(() => {
    if (!socket ||!selectedUser) return;
    socket.emit("chatOpen", { chattingWith: selectedUser._id });
    socket.emit("markSeen", { userId: currentUserId, otherUserId: selectedUser._id });
    return () => socket.emit("chatClose", { chattingWith: selectedUser._id });
  }, [selectedUser?._id, socket, currentUserId]);

  // DELETE LISTENERS
  useEffect(() => {
    if (!socket) return;
    const onDeleteMe = ({ messageId }) => setMessages((prev) => prev.filter((m) => m._id!== messageId));
    const onDeleteEveryone = ({ messageId }) => setMessages((prev) => prev.map((m) => m._id === messageId? {...m, isDeleted: true } : m));
    const onReaction = ({ messageId, emoji, userId }) => { addReaction?.(messageId, { emoji, userId }); setMessages((prev) => prev.map((m) => m._id === messageId? {...m, reactions: [...(m.reactions || []), { emoji, userId }] } : m)); };
    socket.on("messageDeletedForMe", onDeleteMe);
    socket.on("messageDeleted", onDeleteEveryone);
    socket.on("messageReaction", onReaction);
    return () => { socket.off("messageDeletedForMe", onDeleteMe); socket.off("messageDeleted", onDeleteEveryone); socket.off("messageReaction", onReaction); };
  }, [socket]);

  // GROUP BY DATE - FROM YOUR OTHER PROJECT
  const groupedMessages = useMemo(() => {
    if (!messages?.length) return {};
    return messages.reduce((acc, msg) => {
      if (!msg.createdAt) return acc;
      const date = new Date(msg.createdAt);
      if (!isValidDate(date)) return acc;
      const key = format(date, "yyyy-MM-dd");
      if (!acc[key]) acc[key] = [];
      if (!acc[key].some((m) => m._id === msg._id)) acc[key].push(msg);
      return acc;
    }, {});
  }, [messages]);

  const renderDateSeparator = (date) => {
    if (!isValidDate(date)) return null;
    let label = isToday(date)? "Today" : isYesterday(date)? "Yesterday" : format(date, "EEEE, MMMM d");
    return <div className="flex justify-center my-4"><span className={`px-3 py-1 rounded-full text-xs ${theme === "dark"? "bg-zinc-800 text-gray-300" : "bg-gray-200 text-gray-600"}`}>{label}</span></div>;
  };

  // FILE PREVIEW - FROM YOUR OTHER PROJECT
  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) setFilePreview(URL.createObjectURL(file));
    else setFilePreview(file.name);
    setShowFileMenu(false);
  };

  const sendMessage = async () => {
    if (!selectedFile &&!input.trim()) return;
    try {
      if (selectedFile) {
        const fd = new FormData();
        fd.append("file", selectedFile);
        const { fileUrl, fileType } = await apiFetch("api/chats/upload", { method: "POST", body: fd });
        socket.emit("sendMessage", { senderId: currentUserId, receiverId: selectedUser._id, fileUrl, fileType, message: input.trim() });
      } else {
        socket.emit("sendMessage", { senderId: currentUserId, receiverId: selectedUser._id, message: input.trim() });
      }
      setInput(""); setSelectedFile(null); setFilePreview(null);
    } catch { setToastMessage("Failed to send"); }
  };

  const handleTyping = (t) => {
    setInput(t);
    if (!socket) return;
    if (t.length > 0) socket.emit("typing", { senderId: currentUserId, receiverId: selectedUser._id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit("stopTyping", { senderId: currentUserId, receiverId: selectedUser._id }), 1500);
  };

  const deleteForMe = async () => {
    try { await apiFetch(`api/chats/delete-for-me/${messageToDelete}`, { method: "DELETE" }); setMessages((prev) => prev.filter((m) => m._id!== messageToDelete)); setToastMessage("Deleted for you"); }
    catch { setToastMessage("Failed"); } finally { setShowConfirmModal(false); setMessageToDelete(null); setDeleteMode(null); }
  };
  const deleteForEveryone = async () => {
    try { await apiFetch(`api/chats/delete-for-everyone/${messageToDelete}`, { method: "DELETE" }); setMessages((prev) => prev.map((m) => m._id === messageToDelete? {...m, isDeleted: true } : m)); setToastMessage("Deleted for everyone"); }
    catch { setToastMessage("Only your messages"); } finally { setShowConfirmModal(false); setMessageToDelete(null); setDeleteMode(null); }
  };

  const handleReaction = (messageId, emoji) => {
    socket.emit("addReaction", { messageId, emoji, senderId: currentUserId, receiverId: selectedUser._id });
    setMessages((prev) => prev.map((m) => m._id === messageId? {...m, reactions: [...(m.reactions || []), { emoji, userId: currentUserId }] } : m));
    setShowReactionsFor(null); setShowEmojiForMsg(null);
  };

  const renderLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((p, i) => p.match(urlRegex)? <a key={i} href={p} target="_blank" rel="noreferrer" className="underline text-blue-400">{p}</a> : p);
  };

  const handleVideoCall = () => {
    if (!isUserOnline) return setToastMessage("User offline");
    const avatarUrl = selectedUser.profilePic || "/placeholder.svg";
    const { initiateCall } = useVideoCallStore.getState();
    initiateCall(selectedUser._id, selectedUser.username, avatarUrl, "video");
  };

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  return (
    <div className={`flex flex-col h-full relative ${theme === "dark"? "bg-black text-white" : "bg-white text-black"}`}>
      {/* Header */}
      <div className={`flex items-center gap-3  h- border-b shrink-0 ${theme === "dark"? "border-zinc-800" : "border-gray-200"}`}>
        <button onClick={onBack} className="md:hidden"><FaArrowLeft /></button>
        <img src={selectedUser.profilePic || "/placeholder.svg"} className="w-8 h-8 rounded-full object-cover" />
        <div className="flex-1"><h3 className="text-sm font-semibold">{selectedUser.username}</h3><p className="text-xs text-gray-500">{isTyping? "Typing..." : isUserOnline? "Active now" : "Offline"}</p></div>
        <button onClick={handleVideoCall}><FaVideo className={isUserOnline? "text-green-500" : "text-gray-400"} /></button>
      </div>

      {/* Messages grouped */}
      <div ref={chatContainerRef} onScroll={() => { if (chatContainerRef.current?.scrollTop < 20 && hasMore &&!loadingMore) loadMessages(false); }} className="flex-1 overflow-y-auto px-4 py-2">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <React.Fragment key={date}>
            {renderDateSeparator(new Date(date))}
            {msgs.map((msg) => {
              const senderId = msg.sender?._id || msg.sender;
              const isOwn = senderId?.toString() === currentUserId?.toString();
              if (msg.deletedFor?.some((id) => id.toString() === currentUserId?.toString())) return null;
              return (
                <div key={msg._id} className={`flex group relative mb-1 ${isOwn? "justify-end" : "justify-start"}`}>
                  <div className={`relative max-w-[65%] px-3 py-2 rounded-2xl text-sm ${isOwn? "bg-blue-500 text-white rounded-br-sm" : theme === "dark"? "bg-zinc-800 rounded-bl-sm" : "bg-gray-100 rounded-bl-sm"}`}>

                    {/* Options */}
                    <button onClick={() => setOpenDropdownId(openDropdownId === msg._id? null : msg._id)} className="absolute -top-1 -left-6 opacity-0 group-hover:opacity-100"><HiDotsVertical /></button>

                    {msg.isDeleted? <span className="italic text-xs opacity-70">🚫 This message was deleted</span> : <>
                      {msg.message && <p className="whitespace-pre-wrap break-words">{renderLinks(msg.message)}</p>}
                      {msg.fileType?.includes("image") && <img src={msg.fileUrl} className="mt-2 rounded-lg max-w-" />}
                      {msg.fileType?.includes("video") && <video src={msg.fileUrl} controls className="mt-2 rounded-lg max-w-" />}
                      {msg.fileType?.includes("audio") && <audio src={msg.fileUrl} controls className="mt-2 w-full" />}
                    </>}

                    {/* Reactions */}
                    {msg.reactions?.length > 0 && <div className={`absolute -bottom-3 ${isOwn? "right-2" : "left-2"} ${theme === "dark"? "bg-zinc-700" : "bg-gray-200"} rounded-full px-2 py-0.5 text-xs`}>{msg.reactions.map((r, i) => <span key={i}>{r.emoji}</span>)}</div>}

                    <div className="flex items-center justify-end gap-1 text- opacity-70 mt-1">
                      <span>{msg.createdAt? format(new Date(msg.createdAt), "HH:mm") : ""}</span>
                      {isOwn && <>{msg.messageStatus === "sent" && <FaCheck size={10} />}{msg.messageStatus === "delivered" && <FaCheckDouble size={10} />}{msg.messageStatus === "read" && <FaCheckDouble size={10} className="text-blue-200" />}</>}
                    </div>

                    {/* Quick reactions hover */}
                    <div className={`absolute ${isOwn? "-left-10" : "-right-10"} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex`}><button onClick={() => setShowReactionsFor(showReactionsFor === msg._id? null : msg._id)} className="p-1.5 bg-white dark:bg-zinc-700 rounded-full shadow"><FaSmile className="text-xs" /></button></div>

                    {showReactionsFor === msg._id && <div ref={reactionRef} className="absolute -top-8 left-0 bg-zinc-800 rounded-full px-2 py-1 flex gap-1 z-20">{quickReactions.map((e, i) => <button key={i} onClick={() => handleReaction(msg._id, e)} className="hover:scale-125">{e}</button>)}<button onClick={() => { setShowEmojiForMsg(msg._id); setShowReactionsFor(null); }} className="text-white">+</button></div>}

                    {openDropdownId === msg._id && <div ref={dropdownRef} className="absolute top-8 right-0 w-40 bg-white dark:bg-zinc-800 border rounded-xl shadow-lg text-xs z-30"><button onClick={() => { navigator.clipboard.writeText(msg.message); setOpenDropdownId(null); setToastMessage("Copied"); }} className="flex gap-2 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700"><FaRegCopy /> Copy</button><button onClick={() => { triggerForwardMode(msg); setOpenDropdownId(null); }} className="flex gap-2 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700">Forward</button><button onClick={() => { setMessageToDelete(msg._id); setDeleteMode("me"); setShowConfirmModal(true); }} className="flex gap-2 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700"><FaTrashAlt /> Delete for me</button>{isOwn && <button onClick={() => { setMessageToDelete(msg._id); setDeleteMode("everyone"); setShowConfirmModal(true); }} className="flex gap-2 w-full px-3 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-zinc-700"><FaTrashAlt /> Delete for everyone</button>}{msg.fileUrl && <a href={msg.fileUrl} download className="flex gap-2 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700">Download</a>}</div>}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview before send */}
      {filePreview && <div className="relative p-2 border-t bg-gray-50 dark:bg-zinc-900"><button onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><FaTimes size={10} /></button>{selectedFile?.type?.startsWith("video/")? <video src={filePreview} controls className="w-64 mx-auto rounded" /> : selectedFile?.type?.startsWith("image/")? <img src={filePreview} className="w-64 mx-auto rounded" /> : <p className="text-xs text-center">{filePreview}</p>}</div>}

      {/* Input */}
      <div className={`p-3 border-t flex items-center gap-2 ${theme === "dark"? "border-zinc-800 bg-black" : "border-gray-200 bg-white"}`}>
        <button onClick={() => setShowEmoji(!showEmoji)}><FaRegSmile className="text-xl text-gray-500" /></button>
        <div className="relative">
          <button onClick={() => setShowFileMenu(!showFileMenu)}><FaPaperclip className="text-gray-500" /></button>
          {showFileMenu && <div className={`absolute bottom-8 left-0 ${theme === "dark"? "bg-zinc-800" : "bg-white"} rounded-lg shadow-lg p-1 text-xs`}><input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*,audio/*,.pdf" /><button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-zinc-700 rounded">Image/Video</button><button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-zinc-700 rounded">Document</button></div>}
        </div>
        <input value={input} onChange={(e) => handleTyping(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Message..." className="flex-1 bg-transparent outline-none text-sm" />
        <button onClick={sendMessage} className="text-blue-600"><FaPaperPlane /></button>
        {showEmoji && <div ref={emojiRef} className="absolute bottom-16 right-10 z-50"><EmojiPicker onEmojiClick={(e) => { setInput((p) => p + e.emoji); setShowEmoji(false); }} /></div>}
        {showEmojiForMsg && <div className="absolute bottom-20 right-10 z-50"><EmojiPicker onEmojiClick={(e) => { handleReaction(showEmojiForMsg, e.emoji); }} /></div>}
      </div>

      {showConfirmModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className={`p-5 rounded-xl w- ${theme === "dark"? "bg-zinc-900" : "bg-white"}`}><p className="font-semibold text-sm">{deleteMode === "everyone"? "Delete for everyone?" : "Delete for you?"}</p><p className="text-xs text-gray-500 mt-1 mb-4">{deleteMode === "everyone"? "Will be deleted for both." : "Will be deleted only for you."}</p><div className="flex justify-end gap-2"><button onClick={() => setShowConfirmModal(false)} className="px-3 py-1 border rounded-lg text-sm">Cancel</button><button onClick={() => deleteMode === "everyone"? deleteForEveryone() : deleteForMe()} className={`px-3 py-1 rounded-lg text-sm text-white ${deleteMode === "everyone"? "bg-red-600" : "bg-blue-600"}`}>{deleteMode === "everyone"? "Delete for everyone" : "Delete for me"}</button></div></div></div>}

      {toastMessage && <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-4 py-2 rounded-full">{toastMessage}</div>}
    </div>
  );
}