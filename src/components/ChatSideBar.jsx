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

  const usersToDisplay = searchQuery? results : followedUsers;

  return (
    <div className={`flex flex-col h-full ${theme === 'dark'? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className={`p-4 border-b ${theme === 'dark'? 'border-zinc-800' : 'border-gray-200'}`}>
        <h2 className="font-bold text-lg">{loggedUser.username} <span className="text-gray-400">▼</span></h2>
      </div>
      <div className="p-3">
        <input value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="Search" className={`w-full rounded-full px-4 py-1.5 text-sm outline-none ${theme === 'dark'? 'bg-zinc-800' : 'bg-gray-100'}`} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className={`px-4 py-2 flex justify-between text-sm ${theme === 'dark'? 'text-white' : ''}`}>
          <span className="font-semibold">Messages</span><span className="text-gray-500 text-xs">Requests</span>
        </div>
        {usersToDisplay.map(user => {
          const isOnline = onlineUsers.some(id => id.toString() === user._id.toString());
          const isSelected = selectedUser?._id === user._id;
          return (
            <div key={user._id} onClick={() =>!isForwarding && setSelectedUser(user)} className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 ${isSelected? "bg-gray-100 dark:bg-zinc-800" : ""}`}>
              <div className="relative">
                <img src={user.profilePic || "/placeholder.svg"} className="w-14 h-14 rounded-full object-cover" />
                {isOnline && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{user.username}</p>
                <p className="text-xs text-gray-500 truncate">{isOnline? "Active now" : user.lastMessage?.message?.slice(0, 20) || "Tap to chat"}</p>
              </div>
              {user.unreadCount > 0 && <span className="bg-blue-500 text-white text- w-5 h-5 flex items-center justify-center rounded-full">{user.unreadCount}</span>}
              {isForwarding && <input type="checkbox" checked={selectedForwardUsers.includes(user._id)} onChange={() => setSelectedForwardUsers(p => p.includes(user._id)? p.filter(id => id!== user._id) : [...p, user._id])} />}
            </div>
          );
        })}
      </div>

      {isForwarding && (
        <div className="p-3 border-t flex gap-2">
          <button onClick={() => { onSelectForwardUser(selectedForwardUsers); setSelectedForwardUsers([]); }} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">Send</button>
          <button onClick={() => { setSelectedForwardUsers([]); setForwardMode(false, null); onSelectForwardUser([]); }} className="flex-1 bg-gray-200 py-2 rounded-lg text-sm">Cancel</button>
        </div>
      )}
    </div>
  );
}