import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data User saat halaman dibuka
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/users");
        setUsers(data);
      } catch (error) {
        alert("Gagal mengambil data user");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // 2. Fungsi Hapus User
  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus tim ini?")) {
      try {
        await api.delete(`/users/${id}`);
        // Update state lokal biar tabel langsung berubah tanpa refresh
        setUsers(users.filter((user) => user._id !== id));
      } catch (error) {
        console.error(error);
        alert("Gagal menghapus user");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            Manajemen Peserta
          </h1>
          <Link
            to="/admin/dashboard"
            className="text-indigo-600 hover:underline"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Tim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Ketua Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asal Sekolah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center">
                    Memuat data...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center">
                    Belum ada peserta terdaftar.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {user.namaTeam}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {user.namaKetuaTeam ? user.namaKetuaTeam : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {user.asalSekolah}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md"
                      >
                        Hapus
                      </button>
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

export default AdminUsers;
