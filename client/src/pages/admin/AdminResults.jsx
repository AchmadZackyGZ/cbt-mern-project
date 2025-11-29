import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/axios";

const AdminResults = () => {
  const { quizId } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.get(`/exam/leaderboard/${quizId}`);
        setResults(data);
      } catch (error) {
        console.error("Gagal ambil hasil:", error);
        alert("Gagal memuat hasil ujian.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [quizId]);

  // Helper: Format Durasi (ms -> Menit:Detik)
  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Hasil & Peringkat Ujian
          </h1>
          <Link to="/admin/quizzes" className="text-indigo-600 hover:underline">
            ← Kembali ke Daftar Kuis
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">
              Leaderboard Realtime
            </h2>
            <button
              onClick={() => window.location.reload()}
              className="text-sm bg-white border px-3 py-1 rounded hover:bg-gray-50"
            >
              Refresh Data
            </button>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Peringkat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Tim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asal Sekolah
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-800 uppercase tracking-wider bg-yellow-50">
                  Skor Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durasi
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Waktu Submit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    Belum ada peserta yang mengumpulkan jawaban.
                  </td>
                </tr>
              ) : (
                results.map((item, index) => (
                  <tr
                    key={item._id}
                    className={index < 3 ? "bg-indigo-50/30" : ""}
                  >
                    {/* Peringkat */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full font-bold 
                          ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : index === 1
                              ? "bg-gray-200 text-gray-700"
                              : index === 2
                              ? "bg-orange-100 text-orange-800"
                              : "text-gray-500"
                          }`}
                      >
                        {index + 1}
                      </div>
                    </td>

                    {/* Info Tim */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.userId?.namaTeam || "Tim Terhapus"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.userId?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.userId?.asalSekolah || "-"}
                    </td>

                    {/* Skor */}
                    <td className="px-6 py-4 whitespace-nowrap text-center bg-yellow-50">
                      <span className="text-lg font-bold text-indigo-700">
                        {item.score}
                      </span>
                    </td>

                    {/* Durasi */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-gray-600">
                      {formatDuration(item.duration)}
                    </td>

                    {/* Waktu Submit */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-gray-400">
                      {new Date(item.submittedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminResults;
