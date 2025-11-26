import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../stores/authStore";
import { useState } from "react";

const LoginPage = () => {
  const navigate = useNavigate();

  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const { user, token, message } = response.data;

      console.log("Login Success: ", message);

      //Simpan ke Global State (Zustand) + LocalStorage (otomatis via persist)
      login(user, token);

      // LOGIKA BARU: Cek Role untuk Redirect
      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login Error:", err);
      const msg = err.response?.data?.message || "Gagal menghubungi server.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        {/* --- Header --- */}
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
            Selamat Datang Kembali
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Silakan masuk menggunakan akun <br />
            <span className="font-medium text-indigo-600">Ketua Tim</span>
          </p>
        </div>

        {/* --- Error Alert --- */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">
                  Login Gagal: {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- Form --- */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {/* Input Email */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Tim
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition duration-200"
                placeholder="ketua.tim@email.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Input Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition duration-200"
                placeholder="******"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* --- Submit Button --- */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white 
                ${
                  isLoading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                }
                transition duration-200 ease-in-out shadow-md hover:shadow-lg`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </button>
          </div>

          {/* --- Footer Link --- */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Belum mendaftarkan tim?{" "}
              <Link
                to="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150"
              >
                Daftar di sini
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
