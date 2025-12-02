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

  console.log(`🔄 Auto-submit untuk quiz ${quizId}: Found ${activeSubmissions.length} active submissions`);

  // Auto-submit setiap submission
  for (const submission of activeSubmissions) {
    // Hitung skor berdasarkan jawaban yang ada
    // Soal yang tidak dijawab (kosong) akan dihitung sebagai salah (0)
    let score = 0;

    // Konversi Map answers ke object untuk memudahkan akses
    let answersObj = {};
    try {
      // Handle answers: bisa berupa Map (MongoDB) atau Plain Object (dari JSON)
      if (submission.answers) {
        if (submission.answers instanceof Map) {
          // Konversi Map ke object
          answersObj = Object.fromEntries(submission.answers);
        } else if (typeof submission.answers === 'object' && submission.answers !== null) {
          // Jika sudah plain object (biasa dari JSON/frontend)
          answersObj = submission.answers;
        } else {
          console.log(`⚠️  Submission ${submission._id}: answers type tidak didukung:`, typeof submission.answers);
        }
      } else {
        console.log(`⚠️  Submission ${submission._id}: answers kosong atau null`);
      }
    } catch (error) {
      console.error(`❌ Error konversi answers untuk submission ${submission._id}:`, error.message);
    }

    console.log(`📝 Submission ${submission._id}: answers =`, answersObj);

    questions.forEach((q) => {
      const questionId = q._id.toString();
      const userAnswer = answersObj[questionId];
      const correctAnswer = q.correctAnswer;

      console.log(`   Q ${q.questionNumber} (${questionId}): User=${userAnswer} Correct=${correctAnswer}`);

      // Jika ada jawaban dan benar, tambah skor
      if (userAnswer && userAnswer === correctAnswer) {
        score += 1;
        console.log(`   ✅ Score +1 (Total: ${score})`);
      } else if (!userAnswer) {
        console.log(`   ⭕ Unanswered, no score change`);
      } else {
        console.log(`   ❌ Wrong answer, no score change`);
      }
    });

    // Hitung durasi
    const duration = Math.max(0, submittedAt.getTime() - submission.startTime.getTime());

    console.log(`🔢 Final score untuk submission ${submission._id}: ${score}/${questions.length}`);

    // Simpan semua perubahan ke database
    submission.status = "completed";
    submission.submittedAt = submittedAt;
    submission.score = score;
    submission.duration = duration;
    // Pastikan answers tersimpan (meskipun seharusnya sudah ada)
    if (!submission.answers || Object.keys(answersObj).length === 0) {
      console.log(`📝 Submission ${submission._id}: answers kosong, menyimpan sebagai empty object`);
      submission.answers = {};
    }

    await submission.save();
    submittedCount++;

    console.log(`✅ Submitted submission ${submission._id} with score ${score}`);
  }

  console.log(`📊 Total ${submittedCount} submissions auto-submitted`);
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
