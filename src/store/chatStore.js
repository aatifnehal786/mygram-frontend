import { create } from "zustand";

const useChatStore = create((set) => ({
  selectedUser: null,
  messages: [],
  followedUsers: [],
  isForwarding: false,
  messageToForward: null,

  setSelectedUser: (user) =>
    set({ selectedUser: user }),

  setMessages: (messages) => {
  console.log("SET MESSAGES", messages.length);

  set({
    messages: Array.isArray(messages)
      ? messages
      : [],
  });
},
 addMessage: (message) => {
  console.log("ADD MESSAGE", message);

  set((state) => ({
    messages: [...state.messages, message],
  }));
},

  setFollowedUsers: (users) =>
    set({ followedUsers: users }),

  updateUnreadCount: (senderId, unreadCount) =>
    set((state) => ({
      followedUsers: state.followedUsers.map((user) =>
        user._id === senderId
          ? { ...user, unreadCount }
          : user
      ),
    })),

  updateLastMessage: (otherUserId, msg) =>
    set((state) => {
      const updated = state.followedUsers.map((user) =>
        user._id === otherUserId
          ? {
              ...user,
              lastMessage: msg,
            }
          : user
      );

      updated.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;

        return (
          new Date(b.lastMessage.createdAt) -
          new Date(a.lastMessage.createdAt)
        );
      });

      return { followedUsers: updated };
    }),

  setForwardMode: (value, message = null) =>
    set({
      isForwarding: value,
      messageToForward: message,
    }),
}));

export default useChatStore;