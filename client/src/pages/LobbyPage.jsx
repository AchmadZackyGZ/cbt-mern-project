import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../stores/authStore";

const LobbyPage = () => {
  const { quizCode } = useParams();
  const navigate = useNavigate();

  // PERBAIKAN 1: Destructure user dari useAuthStore dengan benar
  const user = useAuthStore((state) => state.user);

  const [status, setStatus] = useState("waiting");
  const [participants, setParticipants] = useState(0);
  const [joined, setJoined] = useState(false);

  // Join lobby saat pertama kali masuk
  useEffect(() => {
    const joinLobbyOnMount = async () => {
      try {
        await api.post(`/exam/join/${quizCode}`);
        setJoined(true);
      } catch (error) {
        console.error("Gagal bergabung ke lobby:", error);
        if (error.response?.status === 404) {
          alert("Kuis tidak ditemukan. Pastikan kode ujian benar.");
          navigate("/dashboard");
        }
      }
    };

    joinLobbyOnMount();
  }, [quizCode, navigate]);

  // Fungsi Polling: Cek status setiap 3 detik
  useEffect(() => {
    if (!joined) return; // Tunggu sampai join berhasil

    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/exam/status/${quizCode}`);

        // Update state lokal
        setStatus(data.status);
        setParticipants(data.participantCount);

        // JIKA STATUS SUDAH ACTIVE -> PINDAH KE UJIAN
        if (data.status === "active") {
          clearInterval(interval);
          navigate(`/exam/${quizCode}`, { replace: true });
        }
      } catch (error) {
        console.error("Gagal cek status:", error);
      }
    }, 3000); // 3000ms = 3 detik

    return () => clearInterval(interval);
  }, [quizCode, navigate, joined]);

  return (
    <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center text-white p-4">
      <div className="text-center space-y-6">
        {/* Animasi Loading */}
        <div className="animate-bounce text-6xl">⏳</div>

        <h1 className="text-4xl font-bold">Menunggu Host Memulai...</h1>

        {/* PERBAIKAN 2: Menggunakan variable 'status' agar tidak merah lagi */}
        <div className="text-sm font-mono bg-indigo-800 px-3 py-1 rounded inline-block">
          Status Saat Ini:{" "}
          <span className="uppercase text-yellow-300">{status}</span>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
          <p className="text-lg mb-2">
            Halo,{" "}
            <span className="font-bold text-yellow-300">
              {user?.namaTeam || "Peserta"}
            </span>
            !
          </p>
          <p>Anda sudah terhubung ke ruang ujian.</p>
          <p className="text-sm text-indigo-200 mt-4">
            Jangan tutup halaman ini. Otomatis masuk saat admin memulai.
          </p>
        </div>

        <div className="mt-8">
          <p className="text-xl font-semibold">
            Peserta Bergabung: {participants}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;

// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import api from "../api/axios";
// import useAuthStore from "../store/authStore";

// const LobbyPage = () => {
//   const { quizCode } = useParams();
//   const navigate = useNavigate();
//   const { user } = useAuthStore();

//   const [status, setStatus] = useState("waiting");
//   const [participants, setParticipants] = useState(0);

//   // Fungsi Polling: Cek status setiap 3 detik
//   useEffect(() => {
//     const interval = setInterval(async () => {
//       try {
//         const { data } = await api.get(`/exam/status/${quizCode}`);
//         setStatus(data.status);
//         setParticipants(data.participantCount);

//         // JIKA STATUS SUDAH ACTIVE -> PINDAH KE UJIAN
//         if (data.status === "active") {
//           clearInterval(interval);
//           navigate(`/exam/${quizCode}`); // Pindah ke ExamPage yang asli
//         }
//       } catch (error) {
//         console.error("Gagal cek status:", error);
//       }
//     }, 3000); // 3000ms = 3 detik

//     return () => clearInterval(interval);
//   }, [quizCode, navigate]);

//   return (
//     <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center text-white p-4">
//       <div className="text-center space-y-6">
//         {/* Animasi Loading */}
//         <div className="animate-bounce text-6xl">⏳</div>

//         <h1 className="text-4xl font-bold">Menunggu Host Memulai...</h1>

//         <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
//           <p className="text-lg mb-2">
//             Halo,{" "}
//             <span className="font-bold text-yellow-300">{user?.namaTeam}</span>!
//           </p>
//           <p>Anda sudah terhubung ke ruang ujian.</p>
//           <p className="text-sm text-indigo-200 mt-4">
//             Jangan tutup halaman ini.
//           </p>
//         </div>

//         <div className="mt-8">
//           <p className="text-xl font-semibold">
//             Peserta Bergabung: {participants}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LobbyPage;
