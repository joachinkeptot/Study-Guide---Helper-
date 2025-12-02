// @ts-check
import { writable } from "svelte/store";
import { browser } from "$app/environment";

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} email
 */

/**
 * @typedef {Object} AuthState
 * @property {string | null} token
 * @property {User | null} user
 * @property {boolean} isAuthenticated
 */

// Initialize from localStorage if available
function createAuthStore() {
  const storedToken = browser ? localStorage.getItem("jwt_token") : null;
  const storedUser = browser ? localStorage.getItem("user") : null;

  /** @type {AuthState} */
  const initialState = {
    token: storedToken,
    user: storedUser ? JSON.parse(storedUser) : null,
    isAuthenticated: !!storedToken,
  };

  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    /**
     * @param {string} token
     * @param {User} user
     */
    login: (token, user) => {
      if (browser) {
        localStorage.setItem("jwt_token", token);
        localStorage.setItem("user", JSON.stringify(user));
      }
      set({ token, user, isAuthenticated: true });
    },
    logout: () => {
      if (browser) {
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("user");
      }
      set({ token: null, user: null, isAuthenticated: false });
    },
    /**
     * @param {User} user
     */
    updateUser: (user) => {
      if (browser) {
        localStorage.setItem("user", JSON.stringify(user));
      }
      update((state) => ({ ...state, user }));
    },
    // Check if token is still valid
    checkAuth: async () => {
      const token = browser ? localStorage.getItem("jwt_token") : null;
      if (!token) {
        set({ token: null, user: null, isAuthenticated: false });
        return false;
      }

      // You can add an API call here to validate the token
      // For now, just check if it exists
      return true;
    },
  };
}

export const auth = createAuthStore();
