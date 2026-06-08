import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUserStore = create(
  persist(
    (set) => ({
      loggedUser: null,

      setLoggedUser: (user) =>
        set({
          loggedUser: user,
        }),

      logout: () =>
        set({
          loggedUser: null,
        }),
    }),
    {
      name: "token-auth", // localStorage key
    }
  )
);

export default useUserStore;