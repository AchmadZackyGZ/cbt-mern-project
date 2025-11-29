import asyncHandler from "express-async-handler";
import Quiz from "../models/quizModel.js";
import Submission from "../models/submissionModel.js";
import Question from "../models/questionModel.js";
import crypto from "crypto";

// Helper function to generate unique 6-character hex code
const generateUniqueExamCode = async () => {
  let isUnique = false;
  let code;

  while (!isUnique) {
    code = crypto.randomBytes(3).toString("hex"); // 3 bytes = 6 hex characters
    const existingQuiz = await Quiz.findOne({ examCode: code });
    if (!existingQuiz) {
      isUnique = true;
    }
  }

  return code;
};

// @desc    Membuat Kuis baru
// @route   POST /api/quizzes
// @access  Private/Admin
export const createQuiz = asyncHandler(async (req, res) => {
  const { title, description, durationInMinutes } = req.body;

  if (!title || !durationInMinutes) {
    res.status(400);
    throw new Error("Title dan durasi wajib diisi");
  }

  // Generate unique exam code
  const examCode = await generateUniqueExamCode();

  const quiz = await Quiz.create({
    title,
    description,
    durationInMinutes,
    examCode,
  });

  res.status(201).json(quiz);
});

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Private/Admin
export const getQuizzes = asyncHandler(async (req, res) => {
  // Urutkan dari yang terbaru (createdAt: -1)
  const quizzes = await Quiz.find({}).sort({ createdAt: -1 });
  res.json(quizzes);
});

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private/Admin
export const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  if (quiz) {
    await quiz.deleteOne();
    res.json({ message: "Kuis berhasil dihapus" });
  } else {
    res.status(404);
    throw new Error("Kuis tidak ditemukan");
  }
});

// Helper function untuk auto-submit semua submission yang masih aktif
const autoSubmitAllSubmissions = async (quizId) => {
  // Cari semua submission yang masih active atau pending
  const activeSubmissions = await Submission.find({
    quizId,
    status: { $in: ["active", "pending"] },
  });

  // Ambil semua soal untuk quiz ini
  const questions = await Question.find({ quizId });

  const submittedAt = new Date();
  let submittedCount = 0;

  // Auto-submit setiap submission
  for (const submission of activeSubmissions) {
    // Hitung skor berdasarkan jawaban yang ada
    // Soal yang tidak dijawab (kosong) akan dihitung sebagai salah (0)
    let score = 0;

    // Konversi Map answers ke object untuk memudahkan akses
    const answersObj = submission.answers ? submission.answers.toObject() : {};

    questions.forEach((q) => {
      const questionId = q._id.toString();
      // Jika ada jawaban dan benar, tambah skor
      // Jika tidak ada jawaban atau salah, tetap 0 (tidak ditambah)
      if (
        answersObj[questionId] &&
        answersObj[questionId] === q.correctAnswer
      ) {
        score += 1;
      }
      // Jika tidak ada jawaban, score tetap 0 (tidak perlu diubah)
    });

    // Hitung durasi
    const duration = submittedAt.getTime() - submission.startTime.getTime();

    // Update submission
    submission.status = "completed";
    submission.submittedAt = submittedAt;
    submission.score = score;
    submission.duration = duration;

    await submission.save();
    submittedCount++;
  }

  return submittedCount;
};

// @desc    Mengubah status kuis (Start/Stop)
// @route   PUT /api/quizzes/:id/status
export const updateQuizStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'active' atau 'closed'
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    res.status(404);
    throw new Error("Kuis tidak ditemukan");
  }

  // Jika status diubah menjadi 'closed', auto-submit semua submission yang masih aktif
  if (status === "closed" && quiz.status === "active") {
    const submittedCount = await autoSubmitAllSubmissions(quiz._id);
    quiz.status = status;
    await quiz.save();
    res.json({
      message: `Ujian dihentikan. ${submittedCount} peserta telah otomatis disubmit.`,
      submittedCount,
    });
  } else {
    // Jika hanya mengubah ke active atau status lainnya
    quiz.status = status;
    await quiz.save();
    res.json({ message: `Status ujian diubah menjadi ${status}` });
  }
});

// @desc    Reset Ujian (Status -> Waiting & Hapus Nilai Siswa)
// @route   PUT /api/quizzes/:id/reset
// @access  Private/Admin
export const resetQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  if (quiz) {
    // 1. Kembalikan status jadi 'waiting'
    quiz.status = "waiting";
    await quiz.save();

    // 2. Hapus semua history pengerjaan siswa (Submission) untuk kuis ini
    await Submission.deleteMany({ quizId: quiz._id });

    res.json({
      message: "Ujian berhasil di-reset. Status menunggu & nilai dihapus.",
    });
  } else {
    res.status(404);
    throw new Error("Kuis tidak ditemukan");
  }
});
