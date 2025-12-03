// @ts-nocheck
// @ts-check
import { writable } from "svelte/store";
import { browser } from "$app/environment";
import { supabase } from "$lib/supabase";

/**
 * @typedef {Object} AuthState
 * @property {boolean} isAuthenticated
 * @property {Object|null} user
 * @property {string|null} token - Kept for backward compatibility, but session is managed by Supabase
 */

/** @type {AuthState} */
const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
};

function createAuthStore() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,

    /**
     * Initialize auth state from Supabase session
     */
    init: async () => {
      if (!browser) return;

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        update((state) => ({
          ...state,
          isAuthenticated: true,
          user: {
            id: session.user.id,
            email: session.user.email,
          },
          token: session.access_token,
        }));
      }

      // Listen for auth changes
      // @ts-ignore
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          update((state) => ({
            ...state,
            isAuthenticated: true,
            user: {
              id: session.user.id,
              email: session.user.email,
            },
            token: session.access_token,
          }));
        } else {
          set(initialState);
        }
      });
    },

    /**
     * Login with email and password
     * @param {string} email
     * @param {string} password
     */
    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session?.user) {
        update((state) => ({
          ...state,
          isAuthenticated: true,
          user: {
            id: data.user.id,
            email: data.user.email,
          },
          token: data.session.access_token,
        }));
      }

      return data;
    },

    /**
     * Register new user
     * @param {string} email
     * @param {string} password
     */
    register: async (email, password) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.session?.user) {
        update((state) => ({
          ...state,
          isAuthenticated: true,
          user: {
            id: data.user.id,
            email: data.user.email,
          },
          token: data.session.access_token,
        }));
      }

      return data;
    },

    /**
     * Logout current user
     */
    logout: async () => {
      await supabase.auth.signOut();
      set(initialState);
    },

    /**
     * Get current user session
     */
    getSession: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    },
  };
}

export const auth = createAuthStore();
