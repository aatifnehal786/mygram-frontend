import React, { useState } from 'react';
import { apiFetch } from "../api/apiFetch";
import useChatStore from "../store/chatStore";
import usePresenceStore from "../store/usePresenceStore";
import useUserStore from '../store/useUserStore';

export default function ChatSidebar({ onSelectForwardUser, theme }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedForwardUsers, setSelectedForwardUsers] = useState([]);
  const { followedUsers, selectedUser, setSelectedUser, isForwarding, setForwardMode } = useChatStore();
  const { onlineUsers } = usePresenceStore();
  const loggedUser = useUserStore(s => s.loggedUser);


  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) return setResults([]);
    try { const data = await apiFetch(`api/chats/search-users?q=${encodeURIComponent(q)}`); setResults(data); } catch {}
  };

 const safeUsers = Array.isArray(followedUsers)? followedUsers : [];
const usersToDisplay = searchQuery? (Array.isArray(results)? results : []) : safeUsers;

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-[#202C33] text-white' : 'bg-white text-black'}`}>
  {/* Header - WhatsApp Style */}
  <div className={`p-4 flex items-center justify-between ${theme === 'dark' ? 'bg-[#202C33] border-[#374045]' : 'bg-[#075E54] text-white'} border-b`}>
    <h2 className="font-bold text-lg flex items-center gap-2">
      <img src={loggedUser?.profilePic || "/placeholder.svg"} className="w-9 h-9 rounded-full object-cover border-2 border-[#25D366]" />
      {loggedUser.username} <span className="text-white/70 dark:text-[#8696A0] text-xs">▼</span>
    </h2>
    <div className="flex gap-3 text-">
      <span className="cursor-pointer">💬</span>
      <span className="cursor-pointer">⋮</span>
    </div>
  </div>

  {/* Search - WhatsApp Pill */}
  <div className={`p-3 ${theme === 'dark' ? 'bg-[#202C33]' : 'bg-white'}`}>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0] text-sm">🔍</span>
      <input
        value={searchQuery}
        onChange={e => handleSearch(e.target.value)}
        placeholder="Search or start new chat"
        className={`w-full rounded-full pl-9 pr-4 py-2 text-sm outline-none ${theme === 'dark' ? 'bg-[#2A3942] text-white placeholder:text-[#8696A0] focus:ring-2 focus:ring-[#25D366]/30' : 'bg-[#F0F2F5] focus:ring-2 focus:ring-[#25D366]/30'}`}
      />
    </div>
  </div>

  {/* Messages List */}
  <div className="flex-1 overflow-y-auto">
    <div className={`px-4 py-2 flex justify-between text-sm ${theme === 'dark' ? 'text-white' : ''}`}>
      <span className="font-semibold">Messages</span><span className="text-[#8696A0] text-xs cursor-pointer hover:text-[#25D366]">Requests</span>
    </div>

    {usersToDisplay.map(user => {
      const loggedIdStr = loggedUser?._id?.toString() || loggedUser?.id?.toString() || loggedUser?.userid?.toString();
      const userIdStr = user._id?.toString() || user.id?.toString() || user.userid?.toString();
      const isOnline = userIdStr && loggedIdStr && onlineUsers.includes(userIdStr) && userIdStr !== loggedIdStr;
      const isSelected = selectedUser?._id === user._id;

      return (
        <div
          key={user._id}
          onClick={() => !isForwarding && setSelectedUser(user)}
          className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[#F0F2F5] dark:border-[#2A3942]/50
            ${isSelected
              ? theme === 'dark' ? 'bg-[#2A3942]' : 'bg-[#F0F2F5]'
              : theme === 'dark' ? 'bg-[#202C33] hover:bg-[#2A3942]' : 'bg-white hover:bg-[#F0F2F5]'
            }`}
        >
          <div className="relative shrink-0">
            <img
              src={user.profilePic || user.profilePicture || "/placeholder.svg"}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => e.target.src = "/placeholder.svg"}
            />
            {isOnline && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#25D366] border-2 border-white dark:border-[#202C33] rounded-full" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <p className="text- font-medium truncate">{user.username}</p>
              <span className="text- text-[#8696A0] shrink-0 ml-2">now</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <p className={`text- truncate ${isOnline ? "text-[#25D366] font-medium" : "text-[#8696A0]"}`}>
                {isOnline ? "Active now" : user.lastMessage?.message?.slice(0, 30) || "Tap to chat"}
              </p>
              {user.unreadCount > 0 && (
                <span className="bg-[#25D366] text-white text- font-bold min-w- h-5 px-1 flex items-center justify-center rounded-full shrink-0">
                  {user.unreadCount}
                </span>
              )}
            </div>
          </div>
          {isForwarding && (
            <input
              type="checkbox"
              checked={selectedForwardUsers.includes(user._id)}
              onChange={() => setSelectedForwardUsers(p => p.includes(user._id) ? p.filter(id => id !== user._id) : [...p, user._id])}
              className="w-4 h-4 accent-[#25D366]"
            />
          )}
        </div>
      );
    })}

    {usersToDisplay.length === 0 && (
      <p className="text-center text-sm text-[#8696A0] py-10 px-4">
        No chats yet.<br />Search and start a new chat.
      </p>
    )}
  </div>

  {/* Forwarding Footer */}
  {isForwarding && (
    <div className={`p-3 border-t flex gap-2 ${theme === 'dark' ? 'border-[#374045] bg-[#202C33]' : 'border-gray-200 bg-[#F0F2F5]'}`}>
      <button
        onClick={() => { onSelectForwardUser(selectedForwardUsers); setSelectedForwardUsers([]); }}
        className="flex-1 bg-[#25D366] hover:bg-[#1EBE5A] text-white py-2.5 rounded-full text-sm font-semibold transition"
      >
        Send ({selectedForwardUsers.length})
      </button>
      <button
        onClick={() => { setSelectedForwardUsers([]); setForwardMode(false, null); onSelectForwardUser([]); }}
        className="flex-1 bg-white dark:bg-[#2A3942] dark:text-white py-2.5 rounded-full text-sm font-semibold border border-[#D1D7DB] dark:border-[#374045]"
      >
        Cancel
      </button>
    </div>
  )}
</div>
  );
}