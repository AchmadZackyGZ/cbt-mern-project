import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null, // Akan berisi: { email, namaTeam, role }
      token: null, // JWT Token
      isAuthenticated: false,

      // Action: Login
      login: (userData, token) =>
        set({
          user: userData,
          token: token,
          isAuthenticated: true,
        }),

      // Action: Logout
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "cbt-auth-storage", // Nama key di localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAuthStore;
