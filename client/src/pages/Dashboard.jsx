import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";

const Dashboard = () => {
  const navigate = useNavigate();

  // Ambil data user & fungsi logout dari Store
  const { user, logout } = useAuthStore();

  // State untuk menampung ID Ujian (Manual Input)
  const [quizIdInput, setQuizIdInput] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleStartExam = (e) => {
    e.preventDefault();
    if (!quizIdInput.trim()) return alert("Mohon masukkan ID Ujian");

    // Arahkan ke halaman ujian (akan kita buat nanti)
    // Format URL: /exam/:quizId
    navigate(`/lobby/${quizIdInput}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- Navbar --- */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">
                CBT System
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.namaTeam}
                </p>
                <p className="text-xs text-gray-500">{user?.asalSekolah}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="bg-indigo-600 rounded-2xl shadow-xl overflow-hidden mb-10">
          <div className="p-8 sm:p-10">
            <div className="md:flex md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-white">
                  Halo, {user?.namaTeam}! 👋
                </h1>
                <p className="mt-2 text-indigo-100 text-lg">
                  Siap untuk berkompetisi hari ini? Pastikan koneksi internet
                  stabil.
                </p>
              </div>
              <div className="mt-6 md:mt-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Status: Siap Ujian
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Card Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Masuk Ujian */}
          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Masuk Ruang Ujian
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Masukkan ID Ujian yang diberikan oleh panitia / admin untuk
                  memulai pengerjaan.
                </p>
              </div>

              <form
                onSubmit={handleStartExam}
                className="mt-5 sm:flex sm:items-center"
              >
                <div className="w-full sm:max-w-xs">
                  <label htmlFor="quizId" className="sr-only">
                    ID Ujian
                  </label>
                  <input
                    type="text"
                    name="quizId"
                    id="quizId"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    placeholder="Paste ID Quiz di sini..."
                    value={quizIdInput}
                    onChange={(e) => setQuizIdInput(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Mulai Mengerjakan
                </button>
              </form>
            </div>
          </div>

          {/* Card 2: Info / Rules */}
          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Peraturan Ujian
              </h3>
              <ul className="mt-4 list-disc list-inside text-sm text-gray-600 space-y-2">
                <li>Dilarang keras melakukan kecurangan.</li>
                <li>Sistem menggunakan Safe Exam Browser (SEB).</li>
                <li>Waktu berjalan mundur otomatis.</li>
                <li>Tombol "Selesai" akan mengirim jawaban final.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
