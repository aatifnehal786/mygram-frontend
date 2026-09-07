import { create } from "zustand";

const usePresenceStore = create((set) => ({
  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: (users || []).map(id => id.toString()) }),
  addOnlineUser: (userId) => {
    const uid = userId.toString();
    set((s) => ({ onlineUsers: s.onlineUsers.includes(uid) ? s.onlineUsers : [...s.onlineUsers, uid] }));
  },
  removeOnlineUser: (userId) => {
    const uid = userId.toString();
    set((s) => ({ onlineUsers: s.onlineUsers.filter(id => id !== uid) }));
  },
}));

export default usePresenceStore;