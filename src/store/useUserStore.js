import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUserStore = create(
  persist(
    (set) => ({
      loggedUser: null,
      token: null, // ADD THIS
      posts: [],
      publicPosts: [],
      users: [],

      setLoggedUser: (data) => set({
        // data can be { token, user } or { token,...user }
        loggedUser: data.user || data.loggedUser || data,
        token: data.token || data.loggedUser?.token || null
      }),

      setPosts: (updater) => set((state) => ({
        posts: typeof updater === 'function'? updater(state.posts) : updater
      })),

      setPublicPosts: (updater) => set((state) => ({
        publicPosts: typeof updater === 'function'? updater(state.publicPosts) : updater
      })),

      setUsers: (users) => set({ users }),

      updateFeedPost: (postId, newData) => set((state) => ({
        posts: state.posts.map(p => p._id === postId? {...p,...newData } : p),
        publicPosts: state.publicPosts.map(p => p._id === postId? {...p,...newData } : p),
      })),

      removeFeedPost: (postId) => set((state) => ({
        posts: state.posts.filter(p => p._id!== postId),
        publicPosts: state.publicPosts.filter(p => p._id!== postId),
      })),

      logout: () => set({ loggedUser: null, token: null, posts: [], publicPosts: [], users: [] }),
    }),
    {
      name: "token-auth",
    }
  )
);

export default useUserStore;