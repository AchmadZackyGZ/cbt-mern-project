import axios from "axios";
import useAuthStore from "../stores/authStore.js";

// Kita buat variabel baseURL yang dinamis.
// Jika ada env variable (saat di Vercel), pakai itu.
// Jika tidak ada (saat di laptop), pakai localhost.
const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ... (sisa kode interceptor di bawah biarkan sama)
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

// const api = axios.create({
//   baseURL: "http://localhost:5000/api", // Sesuaikan dengan port backend Anda
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Interceptor: Pasang Token otomatis sebelum request dikirim
// api.interceptors.request.use(
//   (config) => {
//     const token = useAuthStore.getState().token;
//     if (token) {
//       config.headers["Authorization"] = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// export default api;
