import { create } from "zustand";

const useChatStore = create((set) => ({
  selectedUser: null,
  messages: [],
  followedUsers: [],
  isForwarding: false,
  messageToForward: null,

  setSelectedUser: (user) => set({ selectedUser: user }),

  // FIXED: accepts array OR function + de-duplicates
  setMessages: (messages) =>
    set((state) => {
      const newMessages = typeof messages === "function" 
        ? messages(state.messages) 
        : messages;

      if (!Array.isArray(newMessages)) return { messages: [] };

      // de-duplicate by _id
      const seen = new Set();
      const unique = [];
      for (const m of newMessages) {
        if (!m?._id) {
          unique.push(m);
          continue;
        }
        if (!seen.has(m._id.toString())) {
          seen.add(m._id.toString());
          unique.push(m);
        }
      }
      return { messages: unique };
    }),

  // FIXED: duplicate check
  addMessage: (message) =>
    set((state) => {
      if (!message?._id) {
        return { messages: [...state.messages, message] };
      }
      if (state.messages.some((m) => m._id?.toString() === message._id?.toString())) {
        return state; // already exists, don't add
      }
      return { messages: [...state.messages, message] };
    }),

  setFollowedUsers: (users) => set({ followedUsers: users }),

  updateUnreadCount: (senderId, unreadCount) =>
    set((state) => ({
      followedUsers: state.followedUsers.map((user) =>
        user._id === senderId ? { ...user, unreadCount } : user
      ),
    })),

  markMessagesSeen: (userId, currentUserId) =>
    set((state) => ({
      messages: state.messages.map((m) => {
        const senderId = m.sender?._id || m.sender;
        if (senderId === currentUserId && (m.receiver?._id || m.receiver) === userId) {
          return { ...m, isSeen: true };
        }
        return m;
      }),
    })),

  updateMessages: (updater) =>
    set((state) => ({
      messages: updater(state.messages),
    })),

  updateLastMessage: (otherUserId, msg) =>
    set((state) => {
      const updated = state.followedUsers.map((user) =>
        user._id === otherUserId ? { ...user, lastMessage: msg } : user
      );
      updated.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
      });
      return { followedUsers: updated };
    }),

  setForwardMode: (value, message = null) =>
    set({
      isForwarding: value,
      messageToForward: message,
    }),

  clearMessages: () => set({ messages: [] }),
}));

export default useChatStore;