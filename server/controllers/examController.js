import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Quiz from "../models/quizModel.js";
import Question from "../models/questionModel.js";
import Submission from "../models/submissionModel.js";

// Helper: Bersihkan kunci jawaban sebelum dikirim ke siswa
const sanitizeQuestions = (questions) => {
  return questions.map((q) => {
    const sanitizedQ = q.toObject();
    delete sanitizedQ.correctAnswer;
    return sanitizedQ;
  });
};

// --- FUNGSI PENCARI KUIS PINTAR (Code / ID) ---
const findQuizByCodeOrId = async (codeOrId) => {
  // 1. Coba cari berdasarkan 'examCode' (kode pendek 6 karakter)
  let quiz = await Quiz.findOne({ examCode: codeOrId });

  // 2. Jika tidak ketemu DAN formatnya mirip ID MongoDB (24 char), cari by ID
  if (!quiz && codeOrId.length === 24) {
    try {
      if (mongoose.Types.ObjectId.isValid(codeOrId)) {
        quiz = await Quiz.findById(codeOrId);
      }
    } catch (err) {
      return null;
    }
  }
  return quiz;
};

// @desc    Memulai atau Melanjutkan kuis
// @route   POST /api/exam/start/:quizCode
export const startOrResumeQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params; // Ini sebenarnya quizCode dari URL
  const userId = req.user._id;

  // GUNAKAN FUNGSI PENCARI PINTAR
  const quiz = await findQuizByCodeOrId(quizId);

  if (!quiz) {
    res.status(404);
    throw new Error("Kuis tidak ditemukan");
  }

  // Cek apakah quiz sudah active
  if (quiz.status !== "active") {
    res.status(403);
    throw new Error("Ujian belum dimulai oleh Admin.");
  }

  // Cari submission yang sudah ada (dari join lobby atau sebelumnya)
  let submission = await Submission.findOne({
    quizId: quiz._id,
    userId,
    status: { $in: ["pending", "active"] }, // Bisa pending (dari lobby) atau active
  });

  if (submission) {
    // Jika submission masih pending (dari lobby), update menjadi active dan reset waktu
    if (submission.status === "pending") {
      const startTime = new Date();
      const endTime = new Date(
        startTime.getTime() + quiz.durationInMinutes * 60000
      );
      submission.startTime = startTime;
      submission.endTime = endTime;
      submission.status = "active";
      await submission.save();
    } else {
      // Jika sudah active, cek apakah waktu sudah habis
      if (Date.now() > submission.endTime.getTime()) {
        submission.status = "completed";
        await submission.save();
        res.status(403);
        throw new Error("Waktu ujian untuk sesi ini sudah habis");
      }
    }
  } else {
    // Jika tidak ada submission, buat baru (fallback)
    const startTime = new Date();
    const endTime = new Date(
      startTime.getTime() + quiz.durationInMinutes * 60000
    );

    submission = await Submission.create({
      quizId: quiz._id,
      userId,
      startTime,
      endTime,
      answers: {},
      status: "active",
    });
  }

  const questions = await Question.find({ quizId: quiz._id }).sort({
    questionNumber: 1,
  });
  const questionsForStudent = sanitizeQuestions(questions);

  res.status(200).json({
    submission,
    questions: questionsForStudent,
  });
});

// @desc    Submit jawaban kuis
// @route   POST /api/exam/submit/:submissionId
export const submitQuiz = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { answers } = req.body;
  const userId = req.user._id;

  const submission = await Submission.findById(submissionId);
  if (!submission) {
    res.status(404);
    throw new Error("Sesi ujian tidak ditemukan");
  }

  if (submission.userId.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("Anda tidak berhak submit sesi ini");
  }

  if (submission.status === "completed") {
    res.status(400);
    throw new Error("Ujian sudah pernah disubmit");
  }

  const submittedAt = new Date();
  // Toleransi 10 detik untuk latency jaringan
  const toleranceLimit = new Date(submission.endTime.getTime() + 10000);

  if (submittedAt.getTime() > toleranceLimit.getTime()) {
    res.status(403);
    throw new Error("Waktu habis! Submission ditolak.");
  }

  const questions = await Question.find({ quizId: submission.quizId });

  let score = 0;
  questions.forEach((q) => {
    const questionId = q._id.toString();
    if (answers[questionId] && answers[questionId] === q.correctAnswer) {
      score += 1;
    }
  });

  const duration = submittedAt.getTime() - submission.startTime.getTime();

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

// @desc    Mendapatkan Leaderboard
// @route   GET /api/exam/leaderboard/:quizId
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  // GUNAKAN FUNGSI PENCARI PINTAR JUGA (Jaga-jaga admin pakai kode)
  const quiz = await findQuizByCodeOrId(quizId);

  if (!quiz) {
    res.status(404);
    throw new Error("Kuis tidak ditemukan");
  }

  const leaderboard = await Submission.find({
    quizId: quiz._id,
    status: "completed",
  })
    .sort({ score: -1, duration: 1 })
    .limit(50)
    .populate("userId", "namaTeam email asalSekolah");

  res.status(200).json(leaderboard);
});

// @desc    Join Lobby (Membuat submission pending)
// @route   POST /api/exam/join/:quizCode
// @access  Private/Student
export const joinLobby = asyncHandler(async (req, res) => {
  const { quizCode } = req.params;
  const userId = req.user._id;

  // Cari quiz berdasarkan examCode
  const quiz = await findQuizByCodeOrId(quizCode);
  if (!quiz) {
    res.status(404);
    throw new Error("Kuis tidak ditemukan");
  }

  // Cek apakah sudah ada submission untuk user ini
  let submission = await Submission.findOne({
    quizId: quiz._id,
    userId,
  });

  // Jika belum ada, buat submission baru dengan status pending
  if (!submission) {
    const startTime = new Date();
    const endTime = new Date(
      startTime.getTime() + quiz.durationInMinutes * 60000
    );

    submission = await Submission.create({
      quizId: quiz._id,
      userId,
      startTime,
      endTime,
      answers: {},
      status: "pending", // Status pending saat di lobby
    });
  }

  res.status(200).json({
    message: "Berhasil bergabung ke lobby",
    quiz: {
      title: quiz.title,
      examCode: quiz.examCode,
      status: quiz.status,
    },
    submission,
  });
});

// @desc    Cek status kuis (Polling)
// @route   GET /api/exam/status/:quizCode
export const checkQuizStatus = asyncHandler(async (req, res) => {
  const { quizCode } = req.params;

  // GUNAKAN FUNGSI PENCARI PINTAR
  const quiz = await findQuizByCodeOrId(quizCode);

  if (!quiz) {
    res.status(404);
    throw new Error("Kuis tidak ditemukan");
  }

  // Hitung jumlah user unik yang sudah join (bukan total submission)
  // Gunakan distinct untuk menghitung userId yang berbeda
  const distinctUsers = await Submission.distinct("userId", {
    quizId: quiz._id,
  });
  const participantCount = distinctUsers.length;

  res.json({
    status: quiz.status || "waiting",
    participantCount,
  });
});
