import { create } from "zustand";

const useChatStore = create((set) => ({
  selectedUser: null,
  messages: [],
  followedUsers: [],
  isForwarding: false,
  messageToForward: null,

  setSelectedUser: (user) => set({ selectedUser: user }),

  // FIXED: accepts array OR function(prev) => newArray
  setMessages: (messages) =>
    set((state) => ({
      messages: typeof messages === "function"
       ? messages(state.messages)
        : Array.isArray(messages)? messages : [],
    })),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setFollowedUsers: (users) => set({ followedUsers: users }),

  updateUnreadCount: (senderId, unreadCount) =>
    set((state) => ({
      followedUsers: state.followedUsers.map((user) =>
        user._id === senderId? {...user, unreadCount } : user
      ),
    })),

  markMessagesSeen: (userId, currentUserId) =>
    set((state) => ({
      messages: state.messages.map((m) => {
        const senderId = m.sender?._id || m.sender;
        if (senderId === currentUserId && (m.receiver?._id || m.receiver) === userId) {
          return {...m, isSeen: true };
        }
        return m;
      }),
    })),

  // keep this for other places
  updateMessages: (updater) =>
    set((state) => ({
      messages: updater(state.messages),
    })),

  updateLastMessage: (otherUserId, msg) =>
    set((state) => {
      const updated = state.followedUsers.map((user) =>
        user._id === otherUserId? {...user, lastMessage: msg } : user
      );
      updated.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
      });
      return { followedUsers: updated };
    }),

  setForwardMode: (value, message = null) =>
    set({ isForwarding: value, messageToForward: message }),

  clearMessages: () => set({ messages: [] }),
}));

export default useChatStore;