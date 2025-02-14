//authStore for HR3

import create from "zustand";
import axios from "axios";


const API_URL = "https://backend-hr3.jjm-manufacturing.com/api/auth";

axios.defaults.withCredentials = true;

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,
  message: null,
  error: null,

  login: async (email, password, verified) => {
    try {
      console.log("HR3 login attempt:", { email, password, verified });
      const csrfResponse = await axios.get(`${API_URL}/csrf-token`);
      const csrfToken = csrfResponse.data.csrfToken;

      const response = await axios.post(
        `${API_URL}/login`,
        { email, password, verified },
        { headers: { "csrf-token": csrfToken } }
      );

      console.log("HR3 login response data:", response.data);

      set({
        isAuthenticated: true,
        user: response.data.user,
        error: null,
      });
      return true;
    } catch (error) {
      console.error("HR3 login error:", error);
      set({
        isAuthenticated: false,
        user: null,
        error: error.response?.data?.message || "Error in logging in!",
      });
      return false;
    }
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/check-auth`);
      set({
        user: response.data.user,
        isAuthenticated: true,
        isCheckingAuth: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isCheckingAuth: false,
        error: error.response?.data?.message || "Error checking authentication",
      });
    }
  },

  logout: async () => {
    try {
      const csrfResponse = await axios.get(`${API_URL}/csrf-token`, {
        withCredentials: true,
      });
      const csrfToken = csrfResponse.data.csrfToken;

      await axios.post(
        `${API_URL}/logout`,
        {},
        {
          withCredentials: true,
          headers: {
            "csrf-token": csrfToken,
          },
        }
      );

      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      if (error.response?.status === 403) {
        console.error("Invalid CSRF token:", error.response.data.message);
        set({
          error: "Your session has expired. Please log in again.",
        });
      } else {
        set({
          error: error.response?.data?.message || "Error logging out",
        });
      }
    }
  },

  fetchUsers: async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      set({
        users: response.data.users,
        error: null,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Error fetching users",
        users: [],
      });
    }
  },
}));
