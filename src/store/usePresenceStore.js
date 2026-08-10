import { create } from "zustand";
const usePresenceStore = create((set) => ({
  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOnlineUser: (userId) => set((s) => ({
    onlineUsers: s.onlineUsers.includes(userId)? s.onlineUsers : [...s.onlineUsers, userId]
  })),
  removeOnlineUser: (userId) => set((s) => ({
    onlineUsers: s.onlineUsers.filter(id => id!== userId)
  })),
}));
export default usePresenceStore;