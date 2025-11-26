import { useState, useEffect } from "react";
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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  // --- 1. DEFINISI FUNGSI UTAMA (DIPINDAH KE ATAS) ---
  // Kita taruh sini supaya bisa dipanggil oleh useEffect di bawahnya
  const handleFinishExam = async (isAuto = false) => {
    if (
      !isAuto &&
      !window.confirm(
        "Apakah Anda yakin ingin mengakhiri ujian? Jawaban tidak bisa diubah lagi."
      )
    ) {
      return;
    }

    try {
      await api.post(`/exam/submit/${submissionId}`, {
        answers: answers,
      });

      alert("Ujian Selesai! Terima kasih.");
      endExam(); // Bersihkan store
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error(error);
      // Jika error karena sudah submit sebelumnya, kita paksa keluar saja
      if (error.response?.status === 400 || error.response?.status === 403) {
        endExam();
        navigate("/dashboard");
      } else {
        alert("Gagal mengirim jawaban. Coba lagi.");
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
        // Panggil fungsi submit otomatis
        handleFinishExam(true);
      } else {
        setTimeLeft(Math.floor(distance / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTime]);
  // Kita disable dependency handleFinishExam agar timer tidak reset setiap kali user menjawab soal

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
