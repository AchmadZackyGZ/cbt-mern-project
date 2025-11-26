import axios from "axios";
import useAuthStore from "../stores/authStore.js";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Sesuaikan dengan port backend Anda
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Pasang Token otomatis sebelum request dikirim
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
