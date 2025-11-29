import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const AdminQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk Form Tambah Kuis
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    durationInMinutes: 120, // Default 2 jam
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. Fetch Data Kuis ---
  const fetchQuizzes = async () => {
    try {
      const { data } = await api.get("/quizzes");
      setQuizzes(data);
    } catch (error) {
      console.error(error);
      alert("Gagal mengambil data kuis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // --- 2. Handle Input Change ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- 3. Handle Buat Kuis Baru ---
  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/quizzes", formData);
      alert("Kuis berhasil dibuat!");
      setFormData({ title: "", description: "", durationInMinutes: 120 }); // Reset form
      fetchQuizzes(); // Refresh tabel
    } catch (error) {
      console.error(error);
      alert("Gagal membuat kuis");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 4. Handle Hapus Kuis ---
  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Yakin hapus kuis ini? Semua soal di dalamnya juga akan hilang."
      )
    ) {
      try {
        await api.delete(`/quizzes/${id}`);
        setQuizzes(quizzes.filter((q) => q._id !== id));
      } catch (error) {
        console.error(error);
        alert("Gagal menghapus kuis");
      }
    }
  };

  // --- 5. FITUR BARU: Handle Start Ujian ---
  const handleStartQuiz = async (id) => {
    if (window.confirm("Mulai ujian sekarang? Status akan menjadi ACTIVE.")) {
      try {
        // Panggil endpoint yang sudah kita buat di backend
        await api.put(`/quizzes/${id}/status`, { status: "active" });
        alert("Ujian DIMULAI! Siswa di Lobby akan otomatis masuk.");
        fetchQuizzes(); // Refresh agar status di tabel berubah
      } catch (error) {
        console.error(error);
        alert("Gagal memulai ujian.");
      }
    }
  };

  // --- 6. FITUR BARU: Handle Stop Ujian ---
  const handleStopQuiz = async (id) => {
    if (window.confirm("Hentikan ujian? Siswa tidak bisa mengerjakan lagi.")) {
      try {
        await api.put(`/quizzes/${id}/status`, { status: "closed" });
        alert("Ujian DITUTUP.");
        fetchQuizzes();
      } catch (error) {
        console.log(error);
        alert("Gagal menutup ujian.");
      }
    }
  };

  // --- 7. FITUR BARU: Handle Reset Ujian ---
  const handleResetQuiz = async (id) => {
    if (
      window.confirm(
        "PERINGATAN: Reset akan MENGHAPUS SEMUA NILAI/HASIL siswa untuk ujian ini.\n\nStatus akan kembali ke 'Menunggu'. Lanjutkan?"
      )
    ) {
      try {
        await api.put(`/quizzes/${id}/reset`);
        alert("Ujian berhasil di-reset!");
        fetchQuizzes(); // Refresh tabel
      } catch (error) {
        console.error(error);
        alert("Gagal mereset ujian.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: Form Tambah Kuis */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Buat Ujian Baru
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Judul Ujian
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Contoh: UTBK Matematika 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Keterangan singkat..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Durasi (Menit)
                </label>
                <input
                  type="number"
                  name="durationInMinutes"
                  required
                  min="1"
                  value={formData.durationInMinutes}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${
                    isSubmitting
                      ? "bg-indigo-400"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  } 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Ujian"}
              </button>
            </form>
            <div className="mt-4">
              <Link
                to="/admin/dashboard"
                className="text-indigo-600 hover:underline text-sm"
              >
                ← Kembali ke Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Daftar Kuis */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Daftar Ujian Aktif
            </h2>

            {loading ? (
              <p className="text-gray-500">Memuat data...</p>
            ) : quizzes.length === 0 ? (
              <p className="text-gray-500">Belum ada ujian dibuat.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Judul
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kode & Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quizzes.map((quiz) => (
                      <tr key={quiz._id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {quiz.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {quiz.durationInMinutes} Menit
                          </div>
                        </td>

                        {/* KOLOM KODE & STATUS */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            {/* Kode Ujian */}
                            <span
                              className="px-2 py-0.5 inline-flex text-xs leading-5 font-bold rounded bg-blue-100 text-blue-800 select-all cursor-pointer"
                              title="Klik untuk copy"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  quiz.examCode || quiz._id
                                );
                                alert("Kode berhasil disalin!");
                              }}
                            >
                              {quiz.examCode || quiz._id}
                            </span>

                            {/* Status Badge */}
                            <div>
                              {quiz.status === "active" ? (
                                <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded bg-green-100 text-green-800">
                                  Active (Sedang Jalan)
                                </span>
                              ) : quiz.status === "closed" ? (
                                <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded bg-red-100 text-red-800">
                                  Selesai
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded bg-gray-100 text-gray-800">
                                  Menunggu
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex flex-col gap-2 items-end">
                            {/* LOGIKA TOMBOL START / STOP / RESET */}
                            <div>
                              {/* Jika Waiting -> Tampilkan MULAI */}
                              {quiz.status === "waiting" && (
                                <button
                                  onClick={() => handleStartQuiz(quiz._id)}
                                  className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded shadow-sm text-xs mr-2"
                                >
                                  ▶ Mulai
                                </button>
                              )}

                              {/* Jika Active -> Tampilkan STOP */}
                              {quiz.status === "active" && (
                                <button
                                  onClick={() => handleStopQuiz(quiz._id)}
                                  className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded shadow-sm text-xs mr-2"
                                >
                                  ⏹ Stop
                                </button>
                              )}

                              {/* Jika Closed (Selesai) -> Tampilkan RESET (BARU) */}
                              {quiz.status === "closed" && (
                                <button
                                  onClick={() => handleResetQuiz(quiz._id)}
                                  className="text-white bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded shadow-sm text-xs mr-2"
                                >
                                  🔄 Reset
                                </button>
                              )}
                            </div>

                            {/* TOMBOL CRUD */}
                            <div className="space-x-2">
                              <Link
                                to={`/admin/quizzes/${quiz._id}/questions`}
                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded text-xs"
                              >
                                + Soal
                              </Link>

                              <Link
                                to={`/admin/quizzes/${quiz._id}/results`}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded text-xs"
                              >
                                🏆 Hasil
                              </Link>

                              <button
                                onClick={() => handleDelete(quiz._id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded text-xs"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminQuizzes;

// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import api from "../../api/axios";

// const AdminQuizzes = () => {
//   const [quizzes, setQuizzes] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // State untuk Form Tambah Kuis
//   const [formData, setFormData] = useState({
//     title: "",
//     description: "",
//     durationInMinutes: 120, // Default 2 jam
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Fetch Data Kuis
//   const fetchQuizzes = async () => {
//     try {
//       const { data } = await api.get("/quizzes");
//       setQuizzes(data);
//     } catch (error) {
//       console.error(error);
//       alert("Gagal mengambil data kuis");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchQuizzes();
//   }, []);

//   // Handle Input Change
//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   // Handle Buat Kuis Baru
//   const handleCreate = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     try {
//       await api.post("/quizzes", formData);
//       alert("Kuis berhasil dibuat!");
//       setFormData({ title: "", description: "", durationInMinutes: 120 }); // Reset form
//       fetchQuizzes(); // Refresh tabel
//     } catch (error) {
//       console.error(error);
//       alert("Gagal membuat kuis");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Handle Hapus Kuis
//   const handleDelete = async (id) => {
//     if (
//       window.confirm(
//         "Yakin hapus kuis ini? Semua soal di dalamnya juga akan hilang."
//       )
//     ) {
//       try {
//         await api.delete(`/quizzes/${id}`);
//         setQuizzes(quizzes.filter((q) => q._id !== id));
//       } catch (error) {
//         console.error(error);
//         alert("Gagal menghapus kuis");
//       }
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 p-8">
//       <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* KOLOM KIRI: Form Tambah Kuis */}
//         <div className="lg:col-span-1">
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <h2 className="text-xl font-bold text-gray-800 mb-4">
//               Buat Ujian Baru
//             </h2>
//             <form onSubmit={handleCreate} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">
//                   Judul Ujian
//                 </label>
//                 <input
//                   type="text"
//                   name="title"
//                   required
//                   value={formData.title}
//                   onChange={handleChange}
//                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                   placeholder="Contoh: UTBK Matematika 2025"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">
//                   Deskripsi
//                 </label>
//                 <textarea
//                   name="description"
//                   rows="3"
//                   value={formData.description}
//                   onChange={handleChange}
//                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                   placeholder="Keterangan singkat..."
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700">
//                   Durasi (Menit)
//                 </label>
//                 <input
//                   type="number"
//                   name="durationInMinutes"
//                   required
//                   min="1"
//                   value={formData.durationInMinutes}
//                   onChange={handleChange}
//                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                 />
//               </div>

//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
//                   ${
//                     isSubmitting
//                       ? "bg-indigo-400"
//                       : "bg-indigo-600 hover:bg-indigo-700"
//                   }
//                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
//               >
//                 {isSubmitting ? "Menyimpan..." : "Simpan Ujian"}
//               </button>
//             </form>
//           </div>
//           <div className="mt-4">
//             <Link
//               to="/admin/dashboard"
//               className="text-indigo-600 hover:underline text-sm"
//             >
//               ← Kembali ke Dashboard
//             </Link>
//           </div>
//         </div>

//         {/* KOLOM KANAN: Daftar Kuis */}
//         <div className="lg:col-span-2">
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <h2 className="text-xl font-bold text-gray-800 mb-4">
//               Daftar Ujian Aktif
//             </h2>

//             {loading ? (
//               <p className="text-gray-500">Memuat data...</p>
//             ) : quizzes.length === 0 ? (
//               <p className="text-gray-500">Belum ada ujian dibuat.</p>
//             ) : (
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Judul
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Durasi
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         ID Ujian (Kode)
//                       </th>
//                       <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Aksi
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {quizzes.map((quiz) => (
//                       <tr key={quiz._id}>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="text-sm font-medium text-gray-900">
//                             {quiz.title}
//                           </div>
//                           <div className="text-xs text-gray-500">
//                             {quiz.description}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                           {quiz.durationInMinutes} Menit
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span
//                             className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 select-all cursor-pointer"
//                             title="Klik untuk copy"
//                             onClick={() => {
//                               navigator.clipboard.writeText(
//                                 quiz.examCode || quiz._id
//                               );
//                               alert("Kode ujian berhasil disalin!");
//                             }}
//                           >
//                             {quiz.examCode || quiz._id}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
//                           {/* Tombol Add Soal */}
//                           <Link
//                             to={`/admin/quizzes/${quiz._id}/questions`}
//                             className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded inline-block"
//                           >
//                             + Soal
//                           </Link>

//                           <Link
//                             to={`/admin/quizzes/${quiz._id}/results`}
//                             className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded inline-block"
//                           >
//                             🏆 Hasil
//                           </Link>

//                           <button
//                             onClick={() => handleDelete(quiz._id)}
//                             className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded"
//                           >
//                             Hapus
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminQuizzes;
