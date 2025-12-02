import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BlockMath, InlineMath } from "react-katex";
import api from "../api/axios";
import useExamStore from "../stores/examStore";

const ExamPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  // Ambil state dan actions dari Zustand
  const {
    isExamActive,
    quizData,
    questions,
    answers,
    submissionId,
    endTime,
    startExam,
    setAnswer,
    endExam,
  } = useExamStore();

  // --- PERBAIKAN 1: BUAT REF UNTUK MENYIMPAN SUBMISSION ID ---
  // Ref ini akan selalu memegang nilai terbaru, bahkan di dalam interval/timer
  const submissionIdRef = useRef(submissionId);
  const answersRef = useRef(answers);

  // --- PERBAIKAN 2: SINKRONISASI REF DENGAN STATE ---
  // Setiap kali submissionId berubah (misal setelah fetch data), update Ref-nya
  useEffect(() => {
    submissionIdRef.current = submissionId;
  }, [submissionId]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  const handleFinishExam = async (isAuto = false) => {
    // 1. Konfirmasi Manual
    // Hanya tanya jika user mengklik tombol sendiri (bukan auto submit)
    if (!isAuto) {
      const isConfirmed = window.confirm(
        "Apakah Anda yakin ingin mengakhiri ujian? Jawaban tidak bisa diubah lagi."
      );
      if (!isConfirmed) return;
    }

    // --- PERBAIKAN 3: GUNAKAN REF UNTUK PENGECEKAN ID ---
    // Jangan gunakan variabel 'submissionId' langsung, tapi gunakan 'submissionIdRef.current'
    // AMBIL ID DARI REF (Data Paling Update)
    const currentId = submissionIdRef.current;
    const currentAnswers = answersRef.current;

    if (!currentId) {
      console.error(
        "Submission ID hilang di Ref. Coba cari localStorage/Store."
      );
      // Darurat: Jangan langsung endExam(), cek dulu apakah benar-benar null
      // Jika null, log error tapi jangan hapus state dulu kalau bisa di-rescue
      return;
    }

    // LOGIC ERROR NULL LAWASSSSSSSSSSSSSS
    // --- FIX UTAMA: PENCEGAHAN ERROR NULL ---
    // Jika submissionId hilang (misal karena refresh/error), jangan panggil API!
    // Langsung saja bersihkan dan keluar.
    // if (!submissionId) {
    //   console.warn("Submission ID tidak ditemukan. Keluar paksa.");
    //   // Opsional: Coba cari backup di localStorage jika perlu /* TODO */ if error submission
    //   // const backupId = localStorage.getItem('activeSubmissionId'); /* TODO */ if error submission
    //   endExam();
    //   navigate("/dashboard", { replace: true });
    //   return;
    // }

    try {
      // 2. Request ke Backend // 2. Request ke Backend MENGGUNAKAN ID DARI REF agar tidak tabrakan
      const response = await api.post(`/exam/submit/${currentId}`, {
        answers: currentAnswers,
      });

      // 3. Sukses
      // Cek apakah sudah completed sebelumnya (sudah auto-submit oleh admin)
      if (response.data.alreadyCompleted) {
        console.log(
          "Submission sudah completed sebelumnya (auto-submit oleh sistem)"
        );
        // Jangan kasih alert lagi karena user sudah tau dari polling
      } else {
        // Jika manual, kasih ucapan. Jika auto (waktu habis), skip ini biar tidak double alert
        if (!isAuto) {
          alert("Ujian Selesai! Terima kasih.");
        }
      }

      // 4. Bersihkan Store & Redirect
      endExam();
      navigate("/dashboard", { replace: true }); // Pakai replace agar tidak bisa 'Back'
    } catch (error) {
      console.error("Submit Error:", error);

      const status = error.response?.status;

      // KASUS A: Fatal (400=Sudah Submit, 403=Waktu Habis, 404=Data Hilang/Reset oleh Admin)
      if (status === 400 || status === 403 || status === 404) {
        // JIKA 404 (Sesi Hilang), Beri pesan spesifik
        if (status === 404) {
          alert(
            "Sesi ujian Anda tidak valid atau telah di-reset oleh Admin. Anda akan diarahkan keluar."
          );
        } else if (status === 400) {
          // 400 bisa jadi submissionId invalid atau sudah submit
          console.log("Submission ID invalid atau sudah diproses");
        } else {
          alert("Sesi ujian telah berakhir atau sudah dikumpulkan sebelumnya.");
        }

        endExam(); // <--- INI KUNCINYA: Hapus data lokal yang basi
        navigate("/dashboard", { replace: true });
      }

      // KASUS B: Internet Bermasalah
      else {
        alert(
          "Gagal mengirim jawaban (Koneksi tidak stabil). Silakan coba klik tombol Selesai lagi."
        );
      }
    }
  };

  // --- 2. INISIALISASI UJIAN ---
  useEffect(() => {
    const initializeExam = async () => {
      // Resume logic
      if (isExamActive && quizData?._id === quizId) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.post(`/exam/start/${quizId}`);

        startExam(
          { _id: quizId },
          data.questions,
          data.submission._id,
          data.submission.endTime
        );

        setLoading(false);
      } catch (error) {
        console.error("Gagal memulai ujian:", error);
        alert("Gagal memuat ujian. Pastikan koneksi lancar atau ID benar.");
        navigate("/dashboard");
      }
    };

    initializeExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);
  // Warning kuning di sini kita disable karena kita mau ini jalan SEKALI saja saat quizId berubah

  // --- 3. LOGIKA TIMER ---
  useEffect(() => {
    if (!endTime) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const distance = end - now;

      if (distance < 0) {
        // WAKTU HABIS
        clearInterval(interval);
        setTimeLeft(0);
        // Panggil fungsi submit otomatis // Saat ini dipanggil, dia akan pakai submissionIdRef yang terbaru
        handleFinishExam(true);
      } else {
        setTimeLeft(Math.floor(distance / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTime]);
  // Kita disable dependency handleFinishExam agar timer tidak reset setiap kali user menjawab soal

  // --- AUTO-SAVE JAWABAN ---
  useEffect(() => {
    let lastSavedAnswers = {};

    // Fungsi untuk menyimpan jawaban ke server
    const autoSaveAnswers = async () => {
      try {
        if (
          submissionIdRef.current &&
          answers &&
          Object.keys(answers).length > 0 &&
          JSON.stringify(answers) !== JSON.stringify(lastSavedAnswers)
        ) {
          await api.put(`/exam/save-answers/${submissionIdRef.current}`, {
            answers: answers,
          });
          lastSavedAnswers = { ...answers };
          console.log("💾 Answers auto-saved (changes detected)");
        }
      } catch (error) {
        console.error("Auto-save failed:", error);
        // Jangan tampilkan error ke user, biarkan lanjut
      }
    };

    // Jalankan auto-save setiap 30 detik (lebih ringan untuk database)
    const autoSaveInterval = setInterval(autoSaveAnswers, 30000);

    // Cleanup interval
    return () => clearInterval(autoSaveInterval);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - hanya jalan sekali saat component mount

  // --- Polling Status Ujian ---
  useEffect(() => {
    // Fungsi pengecek status
    const checkStatus = async () => {
      try {
        const { data } = await api.get(`/exam/check-status/${quizId}`);

        // Jika Admin mengubah status menjadi 'closed'
        if (data.status === "closed") {
          // Hentikan interval agar tidak looping alert
          clearInterval(statusInterval);

          console.log(
            "📤 Admin stopped exam - saving final answers and notifying server"
          );

          // --- FIX: SIMPAN JAWABAN TERAKHIR SEBELUM AUTO-SUBMIT ---
          // Pastikan jawaban terakhir tersimpan ke database sebelum server auto-submit
          const currentAnswers = answersRef.current;
          if (
            submissionIdRef.current &&
            currentAnswers &&
            Object.keys(currentAnswers).length > 0
          ) {
            try {
              await api.put(`/exam/save-answers/${submissionIdRef.current}`, {
                answers: currentAnswers,
              });
              console.log("💾 Final answers saved before auto-submit");
            } catch (saveError) {
              console.error("Failed to save final answers:", saveError);
              // Lanjutkan saja, server masih bisa auto-submit dengan data sebelumnya
            }
          }

          alert(
            "Ujian telah dihentikan oleh Admin. Jawaban Anda telah otomatis dikumpulkan."
          );

          // Clear state lokal dan redirect - server sudah handle auto-submit
          endExam();
          navigate("/dashboard", { replace: true });
        }
      } catch (error) {
        // --- TAMBAHAN BARU: JIKA 404 SAAT POLLING ---
        if (error.response?.status === 404) {
          clearInterval(statusInterval);
          console.error("Kuis/Sesi hilang saat polling.");
          // Opsional: Bisa paksa keluar juga jika mau ketat
          endExam();
          navigate("/dashboard");
        }
      }
    };

    // Jalankan setiap 5 detik (5000 ms)
    const statusInterval = setInterval(checkStatus, 5000);

    // Cleanup saat component unmount
    return () => clearInterval(statusInterval);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]); // Dependency ke quizId

  // --- RENDER HELPERS ---
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const renderContent = (text) => {
    if (!text) return null;
    const blockParts = text.split("$$");
    return blockParts.map((part, index) => {
      if (index % 2 === 1) return <BlockMath key={index}>{part}</BlockMath>;
      return (
        <span key={index}>
          {part.split("$").map((subPart, subIndex) => {
            if (subIndex % 2 === 1)
              return (
                <InlineMath key={`${index}-${subIndex}`}>{subPart}</InlineMath>
              );
            return <span key={`${index}-${subIndex}`}>{subPart}</span>;
          })}
        </span>
      );
    });
  };

  const renderInline = (text) => {
    if (!text) return "";
    if (!text.includes("$")) return text;
    return text.split("$").map((part, index) => {
      if (index % 2 === 1) return <InlineMath key={index}>{part}</InlineMath>;
      return <span key={index}>{part}</span>;
    });
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center font-medium text-lg text-gray-600">
        Memuat Ujian...
      </div>
    );
  if (questions.length === 0)
    return (
      <div className="h-screen flex items-center justify-center font-medium text-lg text-gray-600">
        Tidak ada soal.
      </div>
    );

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER: Timer & Info */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Ujian Berlangsung
            </h1>
            <p className="text-sm text-gray-500">
              Soal {currentIndex + 1} dari {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`text-2xl font-mono font-bold px-4 py-2 rounded-lg ${
                timeLeft < 300
                  ? "bg-red-100 text-red-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={() => handleFinishExam(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition"
            >
              Selesai Ujian
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* KIRI: Area Soal (Lebar) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Card Soal */}
          <div className="bg-white p-6 rounded-xl shadow-sm min-h-[400px]">
            <div className="flex justify-between mb-4">
              <span className="bg-indigo-100 text-indigo-800 text-sm font-bold px-3 py-1 rounded-full">
                Nomor {currentQuestion.questionNumber}
              </span>
            </div>

            {/* Teks Soal */}
            <div className="text-lg text-gray-800 leading-relaxed mb-6">
              {renderContent(currentQuestion.questionText)}
            </div>

            {/* Gambar Soal */}
            {currentQuestion.imageUrl && (
              <div className="mb-6">
                <img
                  src={currentQuestion.imageUrl}
                  alt="Soal"
                  className="max-h-64 rounded border bg-gray-50"
                />
              </div>
            )}

            {/* Pilihan Jawaban */}
            <div className="space-y-3">
              {currentQuestion.options.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setAnswer(currentQuestion._id, opt.id)}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition
                        ${
                          answers[currentQuestion._id] === opt.id
                            ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500"
                            : "hover:bg-gray-50 border-gray-200"
                        }`}
                >
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full border mr-4 font-bold text-sm flex-shrink-0
                          ${
                            answers[currentQuestion._id] === opt.id
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white text-gray-500 border-gray-300"
                          }`}
                  >
                    {opt.id}
                  </div>
                  <div className="text-gray-700">{renderInline(opt.text)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tombol Navigasi Bawah */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Sebelumnya
            </button>

            <button
              onClick={() =>
                setCurrentIndex((prev) =>
                  Math.min(questions.length - 1, prev + 1)
                )
              }
              disabled={currentIndex === questions.length - 1}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Selanjutnya
            </button>
          </div>
        </div>

        {/* KANAN: Navigasi Nomor (Sidebar) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-4 rounded-xl shadow-sm sticky top-24">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">
              Navigasi Soal
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q._id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-10 w-full rounded flex items-center justify-center text-sm font-bold transition
                         ${
                           currentIndex === idx
                             ? "ring-2 ring-indigo-500 border-transparent z-10"
                             : ""
                         }
                         ${
                           answers[q._id]
                             ? "bg-indigo-600 text-white" // Sudah dijawab
                             : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                         } // Belum dijawab
                      `}
                >
                  {q.questionNumber}
                </button>
              ))}
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <div className="w-3 h-3 bg-indigo-600 rounded"></div> Sudah
                Dijawab
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-3 h-3 bg-gray-100 border rounded"></div> Belum
                Dijawab
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamPage;
