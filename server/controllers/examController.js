import asyncHandler from "express-async-handler";
import Quiz from "../models/quizModel.js";
import Question from "../models/questionModel.js";
import Submission from "../models/submissionModel.js";

// --- (Fungsi Helper untuk 'membersihkan' soal) ---
// WAJIB: Jangan pernah kirim 'correctAnswer' ke client!
const sanitizeQuestions = (questions) => {
  return questions.map((q) => {
    // Buat objek baru agar tidak mengubah data asli di server
    const sanitizedQ = q.toObject();
    delete sanitizedQ.correctAnswer;
    return sanitizedQ;
  });
};

// @desc    Memulai atau Melanjutkan kuis
// @route   POST /api/exam/start/:quizId
// @access  Private/Student
const startOrResumeQuiz = asyncHandler(async (req, res) => {
  const quizId = req.params.quizId;
  const userId = req.user._id;

  // 1. Cek Kuisnya ada
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    res.status(404);
    throw new Error("Kuis tidak ditemukan");
  }

  // 2. Cek apakah sudah ada submission yg 'pending' (resume)
  let submission = await Submission.findOne({
    quizId,
    userId,
    status: "pending",
  });

  if (submission) {
    // --- KASUS RESUME ---
    // Cek apakah waktu sudah habis (misal dia tutup browser lama)
    if (Date.now() > submission.endTime.getTime()) {
      submission.status = "completed";
      // (Opsional) Otomatis hitung skor di sini jika mau
      await submission.save();
      res.status(403);
      throw new Error("Waktu ujian untuk sesi ini sudah habis");
    }
  } else {
    // --- KASUS BARU ---
    // 3. Buat submission baru
    const startTime = new Date();
    const endTime = new Date(
      startTime.getTime() + quiz.durationInMinutes * 60000
    );

    submission = await Submission.create({
      quizId,
      userId,
      startTime,
      endTime,
      answers: {},
    });
  }

  // 4. Ambil SEMUA soal untuk kuis ini
  // Kita sort berdasarkan questionNumber agar urut (Poin 2 Anda)
  const questions = await Question.find({ quizId }).sort({ questionNumber: 1 });

  // 5. Bersihkan kunci jawaban
  const questionsForStudent = sanitizeQuestions(questions);

  // 6. Kirim data ujian ke client
  res.status(200).json({
    submission, // Berisi submissionId, endTime, answers
    questions: questionsForStudent, // Berisi 100 soal bersih
  });
});

// @desc    Submit jawaban kuis
// @route   POST /api/exam/submit/:submissionId
// @access  Private/Student
const submitQuiz = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { answers } = req.body; // Frontend kirim: { "questionId": "A", "questionId_2": "C" }
  const userId = req.user._id;

  // 1. Validasi Submission
  const submission = await Submission.findById(submissionId);
  if (!submission) {
    res.status(404);
    throw new Error("Sesi ujian tidak ditemukan");
  }

  // Cek kepemilikan
  if (submission.userId.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("Anda tidak berhak submit sesi ini");
  }

  // Cek status
  if (submission.status === "completed") {
    res.status(400);
    throw new Error("Ujian sudah pernah disubmit");
  }

  // Cek Waktu Habis (Poin 6)
  const submittedAt = new Date();

  // Ini untuk menangani latensi jaringan saat frontend auto-submit
  const toleranceInMilliseconds = 5000; // 5 detik

  const toleranceLimit = new Date(
    submission.endTime.getTime() + toleranceInMilliseconds
  );

  if (submittedAt.getTime() > toleranceLimit.getTime()) {
    // Jika submit-nya telat DAN melebihi batas toleransi, baru kita tolak.
    res.status(403);
    throw new Error("Waktu habis dan melebihi toleransi! Submission ditolak.");
  }

  // if (submittedAt.getTime() > submission.endTime.getTime()) {
  //   res.status(403);
  //   throw new Error("Waktu habis! Submission ditolak.");
  //   // Note: Anda bisa buat logic "toleransi"
  //   // atau auto-submit di frontend beberapa detik sebelum
  // }

  // 2. Ambil KUNCI JAWABAN dari DB (Poin 4)
  const questions = await Question.find({ quizId: submission.quizId });

  // 3. Hitung Skor (WAJIB di Server)
  let score = 0;
  questions.forEach((q) => {
    const questionId = q._id.toString();
    if (answers[questionId] && answers[questionId] === q.correctAnswer) {
      score += 1; // Benar = 1
    }
    // Salah/Tidak dijawab = 0 (otomatis)
  });

  // 4. Hitung Durasi (Poin 6)
  const duration = submittedAt.getTime() - submission.startTime.getTime();

  // 5. Update Submission
  submission.answers = answers;
  submission.status = "completed";
  submission.submittedAt = submittedAt;
  submission.score = score;
  submission.duration = duration;

  const updatedSubmission = await submission.save();

  res.status(200).json({
    message: "Ujian berhasil disubmit",
    result: updatedSubmission,
  });
});

// @desc    Mendapatkan Leaderboard/Ranking untuk kuis
// @route   GET /api/exam/leaderboard/:quizId
// @access  Private (Hanya user login yg bisa lihat)
const getLeaderboard = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  // 1. Cek kuisnya ada atau tidak (opsional tapi bagus)
  const quizExists = await Quiz.findById(quizId);
  if (!quizExists) {
    res.status(404);
    throw new Error("Kuis tidak ditemukan");
  }

  // 2. Query utama (Poin 6 Anda)
  const leaderboard = await Submission.find({
    quizId: quizId,
    status: "completed", // Hanya ambil yg sudah selesai
  })
    .sort({
      score: -1, // Urutkan berdasarkan skor TERTINGGI
      duration: 1, // Lalu urutkan berdasarkan durasi TERCEPAT (ascending)
    })
    .limit(50) // Ambil 20 teratas saja (biar tidak berat)
    .populate("userId", "namaTeam email asalSekolah"); // Ambil info nama user, jangan password!

  res.status(200).json(leaderboard);
});

export { startOrResumeQuiz, submitQuiz, getLeaderboard };
