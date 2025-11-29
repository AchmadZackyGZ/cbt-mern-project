import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";

const AdminDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Proteksi Ganda: Jika Student coba akses URL ini, tendang keluar
  if (user?.role !== "admin") {
    navigate("/dashboard");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar Admin */}
      <nav className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="font-bold text-xl text-yellow-400">
              Admin Panel CBT
            </div>
            <div className="flex items-center space-x-4">
              <span>Halo, Admin</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Dashboard Kontrol
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Menu 1: Kelola Akun */}
          <Link to="/admin/users" className="block group">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 hover:shadow-xl transition">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                👥 Kelola Peserta
              </h3>
              <p className="mt-2 text-gray-600 text-sm">
                Lihat daftar tim terdaftar dan hapus akun jika perlu.
              </p>
            </div>
          </Link>

          {/* Menu 2: Buat Kuis Baru */}
          {/* Nanti arahkan ke page create quiz */}
          <Link to="/admin/quizzes" className="block group">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 hover:shadow-xl transition cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900">
                📝 Buat Ujian Baru
              </h3>
              <p className="mt-2 text-gray-600 text-sm">
                Generate ID Ujian, upload soal, dan atur durasi.
              </p>
            </div>
          </Link>

          {/* Menu 3: Bank Soal */}
          {/* <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500 hover:shadow-xl transition cursor-pointer">
            <h3 className="text-lg font-semibold text-gray-900">
              📚 Bank Soal
            </h3>
            <p className="mt-2 text-gray-600 text-sm">
              Upload gambar soal dan kelola database pertanyaan.
            </p>
          </div> */}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
