// Import axios for making HTTP requests
import axios from "axios";

/**
 * @param {string} prompt
 */
export async function callClaude(prompt) {
  try {
    const response = await axios.post("/api/claude", { prompt });
    return response.data;
  } catch (error) {
    console.error("Claude API error:", error);
    throw error;
  }
}
// @ts-check
import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { auth } from "$stores/auth";
import { get } from "svelte/store";

// Get base URL from environment variable or default to localhost
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

/**
 * Custom fetch wrapper that automatically handles JWT authentication
 * and error responses including 401 redirects
 * @param {string} endpoint
 * @param {RequestInit} [options={}]
 * @returns {Promise<any>}
 */
async function apiFetch(endpoint, options = {}) {
  const authState = get(auth);
  const token = authState.token;

  // Build headers
  const headers = /** @type {Record<string, string>} */ ({
    "Content-Type": "application/json",
    ...(options.headers || {}),
  });

  // Add JWT token if available
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Construct full URL
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    // Clear auth state
    auth.logout();

    // Redirect to login if in browser
    if (browser) {
      goto("/login");
    }

    throw new Error("Unauthorized - please log in again");
  }

  // Handle other error responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
        errorData.message ||
        `HTTP error! status: ${response.status}`
    );
  }

  // Return parsed JSON response
  return await response.json();
}

/**
 * Convenience methods for different HTTP verbs
 */
export const api = {
  /**
   * @param {string} endpoint
   * @param {RequestInit} [options={}]
   */
  get: (endpoint, options = {}) => {
    return apiFetch(endpoint, {
      ...options,
      method: "GET",
    });
  },

  /**
   * @param {string} endpoint
   * @param {any} data
   * @param {RequestInit} [options={}]
   */
  post: (endpoint, data, options = {}) => {
    return apiFetch(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * @param {string} endpoint
   * @param {any} data
   * @param {RequestInit} [options={}]
   */
  put: (endpoint, data, options = {}) => {
    return apiFetch(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * @param {string} endpoint
   * @param {any} data
   * @param {RequestInit} [options={}]
   */
  patch: (endpoint, data, options = {}) => {
    return apiFetch(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * @param {string} endpoint
   * @param {RequestInit} [options={}]
   */
  delete: (endpoint, options = {}) => {
    return apiFetch(endpoint, {
      ...options,
      method: "DELETE",
    });
  },
};

/**
 * Auth-specific API calls
 */
export const authAPI = {
  /**
   * @param {string} email
   * @param {string} password
   */
  login: async (email, password) => {
    const response = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return response;
  },

  /**
   * @param {string} email
   * @param {string} password
   */
  register: async (email, password) => {
    const response = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return response;
  },

  logout: async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      // Even if logout fails, clear local state
      console.error("Logout error:", error);
    } finally {
      auth.logout();
    }
  },
};

export default api;
