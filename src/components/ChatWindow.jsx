import React, { useEffect, useRef, useState, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { apiFetch } from "../api/apiFetch";
import './chat.css';
import { SocketProvider, useSocket } from '../contexts/SocketContext';
import { useDispatch } from "react-redux";
import { clearUnread } from "../redux/slices/notificationSlice";
import { setActiveChat, clearActiveChat } from "../redux/slices/chatSlice";
import { FaVideo, FaEllipsisV, FaArrowLeft} from 'react-icons/fa';
import VideoCallManager from './VideoCallManager';
import useVideoCallStore from "../store/VideoCallStore"
import EmojiPicker from "emoji-picker-react";
import { VscReactions } from "react-icons/vsc";

const REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "👎"];

const ChatWindow = ({ selectedUser, triggerForwardMode, messages, setMessages, onBack }) => {
  const { loggedUser } = useContext(UserContext);
  const { socket } = useSocket()
  const currentUserId = loggedUser?.userid;
  const [input, setInput] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);
  const chatBtn = useRef(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);
  const [onlineMap, setOnlineMap] = useState({});
  const dispatch = useDispatch();
  const chatContainerRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);
  const handleReactionRef = useRef(null);
  



  const [reactionPickerFor, setReactionPickerFor] = useState(null);
  const [limit, setLimit] = useState(20);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);


  useEffect(() => {
    if (!chatContainerRef.current) return;

    const height = chatContainerRef.current.clientHeight;
    const MESSAGE_HEIGHT = 60; // avg bubble height
    const calculatedLimit = Math.ceil(height / MESSAGE_HEIGHT);

    setLimit(calculatedLimit);
  }, []);



 /* -------------------- SOCKET: REACTION UPDATE -------------------- */
 useEffect(() => {
  if (!socket) return;

  const handleReaction = ({ messageId, reactions }) => {
    setMessages(prev =>
      prev.map(msg =>
        msg._id === messageId
          ? { ...msg, reactions }
          : msg
      )
    );
  };

  socket.on("message-reaction", handleReaction);

  return () => {
    socket.off("message-reaction", handleReaction);
  };
}, [socket]);









  useEffect(() => {
    if (selectedUser?._id) {
      dispatch(setActiveChat(selectedUser._id));
    }

    return () => {
      dispatch(clearActiveChat()); // chat closed
    };
  }, [selectedUser, dispatch]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);


  // console.log(messages)

 useEffect(() => {
  if (!chatContainerRef.current) return;

  const container = chatContainerRef.current;
  const isNearBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight < 100;

  if (isNearBottom) {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }
}, [messages]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
        
      }
      if (handleReactionRef.current && !handleReactionRef.current.contains(event.target)) {
        setReactionPickerFor(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


 /* -------------------- ADD REACTION -------------------- */
 




  const sendMessage = () => {
    if (!input.trim()) return;

    socket.emit('sendMessage', {
      senderId: currentUserId,
      receiverId: selectedUser._id,
      message: input.trim(),
    });

    setInput('');
  };


  // handle copy text message to clipboard
  const copyMessageToInput = (text) => {
  if (!text) return;

  // update input using your existing logic
  handleTypingLogic(text);

  // focus the input
  setTimeout(() => {
    inputRef.current?.focus();
  }, 0);

  // close message dropdown if open
  setOpenDropdownId(null);
};


  useEffect(() => {
    const closeEmoji = (e) => {
      // 🛑 allow emoji button click
      if (
        e.target.closest(".emoji-picker-react") ||
        e.target.closest(".emoji-btn")
      ) {
        return;
      }
      setShowEmojiPicker(false);
    };

    document.addEventListener("click", closeEmoji);
    return () => document.removeEventListener("click", closeEmoji);
  }, []);


  const handleEmojiClick = (emojiData) => {
  setInput((prev) => prev + emojiData.emoji);
  inputRef.current?.focus();
};


  // File upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { fileUrl, fileType } = await apiFetch("api/chats/upload", {
        method: "POST",
        body: formData,
      });

      socket.emit("sendMessage", {
        senderId: currentUserId,
        receiverId: selectedUser._id,
        fileUrl,
        fileType,
      });
    } catch (err) {
      console.error("File upload failed:", err.message);
      setToastMessage("Failed to upload file.");
    }
  };

  // Delete chat message
  const deleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      await apiFetch("api/chats/delete-chat", {
        method: "DELETE",
        body: JSON.stringify({ messageIds: [messageToDelete] }),
      });

      setMessages((prev) => prev.filter((msg) => msg._id !== messageToDelete));
      setToastMessage("Message deleted successfully.");
    } catch (err) {
      console.error("Delete failed:", err.message);
      setToastMessage("Failed to delete message.");
    } finally {
      setShowConfirmModal(false);
      setMessageToDelete(null);
    }
  };


  // use effect for online and offline status
  useEffect(() => {
    if (!socket) return;

    socket.emit("get-online-users");

    socket.on("online-users", (userIds) => {
      setOnlineMap(prev => {
        const map = { ...prev };
        userIds.forEach(id => {
          map[id] = { isOnline: true, lastSeen: null };
        });
        return map;
      });
    });

    return () => socket.off("online-users");
  }, [socket]);


  // use Effect for Typing indicators

  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleTyping = (senderId) => {
      if (senderId === selectedUser._id) setIsTyping(true);
    };

    const handleStopTyping = (senderId) => {
      if (senderId === selectedUser._id) setIsTyping(false);
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket, selectedUser, input]);


  useEffect(() => {
    setIsTyping(false); // reset typing when switching users
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser?._id) {
      dispatch(setActiveChat(selectedUser._id));
      dispatch(clearUnread(selectedUser._id));
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!socket || !selectedUser) return;

    socket.emit("markSeen", {
      userId: currentUserId,
      otherUserId: selectedUser._id
    });
  }, [socket, selectedUser, currentUserId]);





  const confirmDelete = (msgId) => {
    
    setMessageToDelete(msgId);
    setShowConfirmModal(true);
  };

  // Utility function to detect and render links
 const urlRegex = /(https?:\/\/[^\s]+)/g;

const renderMessageWithLinks = (text) => {
  // 🔴 HARD GUARD
  if (typeof text !== "string") return text;

  // ✅ NO LINKS → return plain text DIRECTLY
  if (!urlRegex.test(text)) {
    return text;
  }

  // 🔁 Reset regex index (VERY IMPORTANT)
  urlRegex.lastIndex = 0;

  return text.split(urlRegex).map((part, index) =>
    urlRegex.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline break-all"
      >
        {part}
      </a>
    ) : (
      <span key={index}>{part}</span>
    )
  );
};



  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return date.toLocaleDateString();
  }

  const loadMessages = async (initial = false) => {
    if (loadingMore || !hasMore || !selectedUser) return;

    setLoadingMore(true);

    const prevScrollHeight = chatContainerRef.current?.scrollHeight || 0;

    try {
      const data = await apiFetch(
        `api/chats/chat/${selectedUser._id}?limit=${limit}&skip=${initial ? 0 : skip}`
      );

      if (data.length < limit) setHasMore(false);

      setMessages(prev =>
        initial ? data : [...data, ...prev]
      );

      setSkip(prev => prev + limit);

      // 🔒 preserve scroll position
      requestAnimationFrame(() => {
        if (!initial && chatContainerRef.current) {
          const newHeight = chatContainerRef.current.scrollHeight;
          chatContainerRef.current.scrollTop =
            newHeight - prevScrollHeight;
        }
      });

    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoadingMore(false);
    }
  };


  useEffect(() => {
    if (!selectedUser) return;

    setSkip(0);
    setHasMore(true);
    loadMessages(true);
  }, [selectedUser, limit]);


  const handleScroll = () => {
    if (!chatContainerRef.current) return;

    if (chatContainerRef.current.scrollTop === 0) {
      loadMessages();
    }
  };

const handleReaction = (messageId, emoji) => {
  // 🔥 Optimistic UI update
  setMessages(prev =>
    prev.map(msg => {
      if (msg._id !== messageId) return msg;

      const existing = msg.reactions?.find(
        r => r.user === currentUserId && r.emoji === emoji
      );

      let updatedReactions;

      if (existing) {
        // remove reaction
        updatedReactions = msg.reactions.filter(
          r => !(r.user === currentUserId && r.emoji === emoji)
        );
      } else {
        // add reaction
        updatedReactions = [
          ...(msg.reactions || []),
          { user: currentUserId, emoji },
        ];
      }

      return { ...msg, reactions: updatedReactions };
    })
  );

  // 🔥 Send to server
  socket.emit("react-message", {
    messageId,
    userId: currentUserId,
    emoji,
  });

  setReactionPickerFor(null);
};


  const sortedMessages = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));


  const handleDynamicEnter = (e) => {
    if (e.key === "Enter") {
      if (document.activeElement.name === "message") {
        chatBtn.current.click()
      }
    }

  }

  useEffect(() => {
    if (!socket) return;

    const handler = ({ userId }) => {
      setMessages(prev =>
        prev.map(m =>
          m.sender === currentUserId ? { ...m, isSeen: true } : m
        )
      );
    };

    socket.on("messagesSeen", handler);

    return () => {
      socket.off("messagesSeen", handler);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !selectedUser) return;

    socket.emit("chatOpen", {
      chattingWith: selectedUser._id
    });

    socket.emit("markSeen", {
      userId: currentUserId,
      otherUserId: selectedUser._id
    });

    return () => {
      socket.emit("chatClose", {
        chattingWith: selectedUser._id
      });
    };
  }, [selectedUser, socket]);

  const handleTypingLogic = (text) => {
  setInput(text);

  if (!socket || !selectedUser) return;

  if (text.length > 0) {
    socket.emit("typing", {
      senderId: currentUserId,
      receiverId: selectedUser._id,
    });
  }

  clearTimeout(typingTimeout.current);

  typingTimeout.current = setTimeout(() => {
    socket.emit("stopTyping", {
      senderId: currentUserId,
      receiverId: selectedUser._id,
    });
  }, 1000);
};

  
  const handleVideoCall = () => {
    if (selectedUser && onlineMap[selectedUser._id]?.isOnline) {
      // Get the initiateCall function from the store
      const { initiateCall } = useVideoCallStore.getState();
      console.log('this is initial call',initiateCall)

      console.log("Starting video call with selectedContact:", {
        id: selectedUser._id,
        name: selectedUser.username,
        avatar: selectedUser.profilePic, // This should be the URL, not "video"
        fullContact: selectedUser,
      });

      // Make sure we're passing the correct profile picture URL
      const avatarUrl =
        selectedUser.profilePic ||
        "/placeholder.svg?height=128&width=128";

      initiateCall(
        selectedUser._id,
        selectedUser.username,
        avatarUrl, // Pass the actual URL, not "video"
        "video"
      );
    } else {
      alert("User is offline. Cannot initiate video call.");
    }
  };

  return (
  <div className="flex-1 w-full flex flex-col h-full bg-gray-50">

    {/* Header */}
    <div className="flex gap-3 px-4 py-3 border-b bg-white sticky top-0 z-10">
      {/* Back (mobile only) */}
      <button
        onClick={onBack}
        className="md:hidden text-xl text-gray-600 hover:text-black mr-2 focus:outline-none"
      >
        <FaArrowLeft className="h-6 w-6" />
      </button>

      <div className="ml-3 flex-grow">
        <h3 className="font-semibold text-sm">
          {selectedUser.username}
        </h3>
        <p className="text-xs text-gray-500">
          {isTyping
            ? "typing..."
            : onlineMap[selectedUser._id]?.isOnline
              ? "Online"
              : onlineMap[selectedUser._id]?.lastSeen
                ? `Last seen ${formatTime(onlineMap[selectedUser._id].lastSeen)}`
                : "Offline"}
        </p>
      </div>
       <div className="flex items-center space-x-4">
            <button
              className="focus:outline-none"
              onClick={handleVideoCall}
              title={selectedUser.isOnline ? "Start video call" : "User is offline"}
            >
              <FaVideo
                className={`h-5 w-5 text-green-500 hover:text-green-600`}
              />
            </button>
            <button className="focus:outline-none">
              <FaEllipsisV className="h-5 w-5" />
            </button>
          </div>
    </div>

    {/* Messages */}
    <div
      ref={chatContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-3 space-y-3 w-full"
    >
      {sortedMessages.map((msg, idx) => {
        const senderId = msg.sender?._id || msg.sender;
        const isOwnMessage = senderId === currentUserId;
        const isDropdownOpen = openDropdownId === msg._id;
        
        return (
          <div
            key={msg._id || idx}
            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`
                relative max-w-[75%] rounded-xl px-3 py-2 text-sm m-10
                ${isOwnMessage
                  ? "bg-green-600 text-white rounded-br-none"
                  : "bg-white text-gray-800 rounded-bl-none border"}
              `}
            >
              {/* Options */}
              <button
                onClick={() =>
                  setOpenDropdownId(isDropdownOpen ? null : msg._id)
                }
                className={`absolute top-5 ${isOwnMessage ? "-right-2" : "-left-2"} text-xs text-gray-400 hover:text-gray-700`}
              >
                 <FaEllipsisV className="h-3 w-3" />
              </button>

              {/* Message */}
              <p className="whitespace-pre-wrap break-words min-h-[1rem]">
  {renderMessageWithLinks(msg.message)}
</p>

              
               {/* REACTIONS DISPLAY */}
                {msg.reactions?.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {msg.reactions.map((r, i) => (
                      <span key={i} className="text-xs">{r.emoji}</span>
                    ))}
                  </div>
                )}

                {/* REACTION BUTTON */}
                <button
                  className="absolute -left-2 -top-4 text-sm p-1 m-t-0"
                  onClick={() =>
                    setReactionPickerFor(
                      reactionPickerFor === msg._id ? null : msg._id
                    )
                  }
                >
                  <VscReactions className="h-4 w-4 text-gray-400 hover:text-gray-700" />
                </button>

                {/* REACTION PICKER */}
                {reactionPickerFor === msg._id && (
                  <div ref={handleReactionRef} className={`absolute top-6 ${isOwnMessage ? "right-0" : "left-0"} bg-white border rounded-lg shadow p-2 flex gap-2 z-50`}>
                    {REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg._id, emoji)}
                        className="hover:scale-125 transition"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}


              {/* Attachments */}
              {msg.fileType?.includes("image") && (
                <img
                  src={msg.fileUrl}
                  className="mt-2 rounded-lg max-h-60"
                  alt="chat"
                />
              )}

              {msg.fileType?.includes("video") && (
                <video
                  src={msg.fileUrl}
                  controls
                  className="mt-2 rounded-lg max-h-60"
                />
              )}

              {msg.fileType?.includes("audio") && (
                <audio src={msg.fileUrl} controls className="mt-2 w-full" />
              )}

              {msg.fileType?.includes("pdf") && (
                <a
                  href={msg.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 text-blue-500 underline text-xs"
                >
                  View PDF
                </a>
              )}

              {/* Timestamp */}
              <div className="text-[10px] text-right mt-1 opacity-70">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {isOwnMessage &&
                  (msg.isSeen ? " ✓✓" : msg.isDelivered ? " ✓✓" : " ✓")}
              </div>

              {/* Dropdown */}
              {isDropdownOpen && (
                
                <div
                  ref={dropdownRef}
                  className="absolute -right-4 top-4 bg-white border rounded-md shadow-lg text-xs z-20"
                >
                  <button
                    onClick={() => copyMessageToInput(msg.message)}
                    className="block px-3 py-2 w-full text-left text-blue-800 hover:bg-gray-100"
                  >
                    Copy to input
                  </button>

                  <button
                    onClick={() => triggerForwardMode(msg)}
                    className="block px-3 py-2 text-blue-800 w-full text-left hover:bg-gray-100"
                  >
                    Forward
                  </button>
                  <button
                    onClick={() => confirmDelete(msg._id)}
                    className="block px-3 py-2 w-full text-left text-blue-800 hover:bg-gray-100"
                  >
                    Delete
                  </button>
                  {msg.fileUrl && (
                    <a
                      href={msg.fileUrl}
                      download
                      className="block px-3 py-2 hover:bg-gray-100 text-blue-800 w-full text-left"
                    >
                      Download
                    </a>
                  )}

                </div>
              )}
              {showConfirmModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-xl shadow-lg p-6 w-80 max-w-sm text-center space-y-4">
      <p className="text-gray-800 font-medium">
        Are you sure you want to delete this message?
      </p>

      <div className="flex justify-between gap-4 mt-4">
        <button
          onClick={deleteMessage}
          className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          Yes, Delete
        </button>
        <button
          onClick={() => setShowConfirmModal(false)}
          className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

{toastMessage && (
  <div className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md animate-slide-in">
    {toastMessage}
  </div>
)}

            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>

    {/* Input */}
   {/* Input */}
<div className="flex items-center gap-2 px-3 py-2 border-t bg-white relative">

  {/* Emoji Button */}
<button
  type="button"
  className="emoji-btn text-xl"
  onClick={(e) => {
    e.stopPropagation(); 
    setShowEmojiPicker((prev) => !prev);
  }}
>
  😊
</button>


  {/* Emoji Picker */}
  {showEmojiPicker && (
    <div className="absolute bottom-14 left-3 z-50"  onClick={(e) => e.stopPropagation()}>
      <EmojiPicker
        onEmojiClick={handleEmojiClick}
        height={350}
        width={300}
      />
    </div>
  )}

  <input
    ref={inputRef}
    type="text"
    name='message'
    value={input}
    onChange={(e) => handleTypingLogic(e.target.value)}
    onKeyDown={handleDynamicEnter}
    placeholder="Type a message..."
    className="flex-1 px-4 py-2 rounded-full border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  />

  <label className="cursor-pointer text-xl">
    📎
    <input type="file" hidden onChange={handleFileUpload} />
  </label>

  <button
    ref={chatBtn}
    onClick={() => {
      sendMessage();
      setShowEmojiPicker(false);
    }}
    className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
  >
    Send
  </button>
</div>
    <VideoCallManager selectedUser={selectedUser} socket={socket} />
    
  </div>
);

};

export default ChatWindow;
