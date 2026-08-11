import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUserStore = create(
  persist(
    (set) => ({
      loggedUser: null,
      posts: [],
      publicPosts: [],
      users: [],

      setLoggedUser: (user) => set({ loggedUser: user }),

      setPosts: (updater) => set((state) => ({
        posts: typeof updater === 'function' ? updater(state.posts) : updater
      })),

      setPublicPosts: (updater) => set((state) => ({
        publicPosts: typeof updater === 'function' ? updater(state.publicPosts) : updater
      })),

      setUsers: (users) => set({ users }),

      // FOR LIKE / COMMENT - DYNAMIC NO REFRESH
      updateFeedPost: (postId, newData) => set((state) => ({
        posts: state.posts.map(p => p._id === postId ? { ...p, ...newData } : p),
        publicPosts: state.publicPosts.map(p => p._id === postId ? { ...p, ...newData } : p),
      })),

      removeFeedPost: (postId) => set((state) => ({
        posts: state.posts.filter(p => p._id !== postId),
        publicPosts: state.publicPosts.filter(p => p._id !== postId),
      })),

      logout: () => set({ loggedUser: null, posts: [], publicPosts: [], users: [] }),
    }),
    {
      name: "token-auth",
    }
  )
);

export default useUserStore;