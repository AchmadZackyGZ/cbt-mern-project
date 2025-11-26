import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios"; // Instance axios yang sudah kita setup

const RegisterPage = () => {
  const navigate = useNavigate();

  // State untuk input form
  const [formData, setFormData] = useState({
    namaTeam: "",
    namaKetuaTeam: "",
    asalSekolah: "",
    email: "",
    password: "",
    confPassword: "",
  });

  // State untuk feedback UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle perubahan input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Reset error saat user mengetik ulang
    if (error) setError("");
  };

  // Handle Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 1. Validasi Password Match
    if (formData.password !== formData.confPassword) {
      setError("Password dan Konfirmasi Password tidak cocok.");
      setIsLoading(false);
      return;
    }

    // 2. Validasi Panjang Password
    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter.");
      setIsLoading(false);
      return;
    }

    try {
      // 3. Kirim ke Backend
      // Note: Kita hanya kirim field yang dibutuhkan backend
      const payload = {
        namaTeam: formData.namaTeam,
        namaKetuaTeam: formData.namaKetuaTeam,
        asalSekolah: formData.asalSekolah,
        email: formData.email,
        password: formData.password,
      };

      const response = await api.post("/auth/register", payload);

      console.log("Register Success:", response.data);

      // 4. Redirect ke Login setelah sukses
      alert("Registrasi Berhasil! Silakan login dengan akun tim Anda.");
      navigate("/login");
    } catch (err) {
      // Handle Error dari Backend
      console.error("Register Error:", err);
      const msg =
        err.response?.data?.message || "Terjadi kesalahan saat registrasi.";
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
            Daftarkan Tim Anda
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            CBT Competition System <br />
            <span className="font-medium text-indigo-600">
              1 Tim = 2 Orang (1 Device)
            </span>
          </p>
        </div>

        {/* --- Error Alert --- */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* --- Form --- */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {/* Group: Identitas Tim */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="namaTeam"
                className="block text-sm font-medium text-gray-700"
              >
                Nama Tim
              </label>
              <input
                id="namaTeam"
                name="namaTeam"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-200"
                placeholder="Contoh: Tim Garuda Kode"
                value={formData.namaTeam}
                onChange={handleChange}
              />
            </div>

            <div>
              <label
                htmlFor="namaKetuaTeam"
                className="block text-sm font-medium text-gray-700"
              >
                Nama Ketua Tim
              </label>
              <input
                id="namaKetuaTeam"
                name="namaKetuaTeam"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-200"
                placeholder="Nama Lengkap Ketua"
                value={formData.namaKetuaTeam}
                onChange={handleChange}
              />
            </div>

            <div>
              <label
                htmlFor="asalSekolah"
                className="block text-sm font-medium text-gray-700"
              >
                Asal Sekolah / Instansi
              </label>
              <input
                id="asalSekolah"
                name="asalSekolah"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-200"
                placeholder="Contoh: SMA Negeri 1 Jakarta"
                value={formData.asalSekolah}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">
              Akun Login
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Group: Akun Login */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Tim
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-200"
                placeholder="ketua.tim@email.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-200"
                  placeholder="******"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label
                  htmlFor="confPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Konfirmasi
                </label>
                <input
                  id="confPassword"
                  name="confPassword"
                  type="password"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-200"
                  placeholder="******"
                  value={formData.confPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* --- Submit Button --- */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white 
                ${
                  isLoading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                }
                transition duration-200 ease-in-out transform hover:-translate-y-0.5 shadow-lg`}
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
                  Mendaftarkan...
                </span>
              ) : (
                "Daftar Sekarang"
              )}
            </button>
          </div>

          {/* --- Footer Link --- */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Sudah mendaftarkan tim?{" "}
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
