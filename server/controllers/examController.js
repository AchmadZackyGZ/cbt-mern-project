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

  if (!quiz && codeOrId.length === 24) {
    try {
      quiz = await Quiz.findById(codeOrId);
    } catch (err) {
      // Abaikan error format ID MongoDB (jika admin pakai ID)
    }
  }

  return quiz;
};

// @desc    Memulai atau Melanjutkan kuis
// @route   POST /api/exam/start/:quizCode
export const startOrResumeQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user._id;

  const quiz = await findQuizByCodeOrId(quizId);
  if (!quiz) {
    res.status(404);
    throw new Error("Kuis tidak ditemukan");
  }

  // 1. Cari dulu apakah submission sudah ada
  let submission = await Submission.findOne({ quizId: quiz._id, userId });

  // 2. LOGIKA UTAMA: HANDLING START VS RESUME
  if (!submission) {
    // --- KASUS BARU (Start) ---

    // Cek status kuis, harus active
    if (quiz.status !== "active") {
      res.status(403);
      throw new Error("Ujian belum dimulai atau sudah ditutup.");
    }

    try {
      // COBA BUAT BARU
      submission = await Submission.create({
        quizId: quiz._id,
        userId,
        startTime: new Date(),
        endTime: new Date(Date.now() + quiz.durationInMinutes * 60000),
        answers: {},
        status: "active",
      });
    } catch (error) {
      // --- FIX CRITICAL UNTUK DUPLICATE ERROR ---
      // Jika error code 11000 (Duplicate Key), artinya request ganda masuk bersamaan.
      // Jangan panik/error, cukup ambil data yang barusan dibuat oleh request "kembarannya".
      if (error.code === 11000) {
        submission = await Submission.findOne({ quizId: quiz._id, userId });
      } else {
        // Jika error lain (misal DB down), baru throw error beneran
        throw error;
      }
    }
  } else {
    // --- KASUS LAMA (Resume) ---

    // Cek jika sudah selesai
    if (submission.status === "completed") {
      res.status(403);
      throw new Error("Anda sudah menyelesaikan ujian ini.");
    }

    // Cek timeout
    if (Date.now() > submission.endTime.getTime()) {
      submission.status = "completed";
      await submission.save();
      res.status(403);
      throw new Error("Waktu habis.");
    }

    // Jika status masih 'pending' (dari lobby), aktifkan sekarang
    if (submission.status === "pending") {
      if (quiz.status !== "active") {
        res.status(403);
        throw new Error("Tunggu admin memulai ujian.");
      }
      submission.status = "active";
      submission.startTime = new Date();
      submission.endTime = new Date(
        Date.now() + quiz.durationInMinutes * 60000
      );
      await submission.save();
    }
  }

  // 3. Ambil Soal
  const questions = await Question.find({ quizId: quiz._id }).sort({
    questionNumber: 1,
  });

  res.status(200).json({
    submission,
    questions: sanitizeQuestions(questions),
  });
});

// @desc    Simpan jawaban sementara (auto-save)
// @route   PUT /api/exam/save-answers/:submissionId
export const saveAnswers = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { answers } = req.body;

  // Validasi ID
  if (!submissionId || !mongoose.Types.ObjectId.isValid(submissionId)) {
    return res.status(400).json({
      message: "ID Submission tidak valid",
    });
  }

  const submission = await Submission.findById(submissionId);

  if (!submission) {
    return res.status(404).json({
      message: "Sesi ujian tidak ditemukan",
    });
  }

  // Jika sesi masih aktif lanjut seperti biasa
  if (submission.status === "active") {
    // lanjut di bawah
  } else if (submission.status === "completed") {
    // Izinkan update JIKA answers masih kosong dan client mengirim data baru
    const existingEmpty =
      !submission.answers || Object.keys(submission.answers).length === 0;
    const newProvided =
      answers && typeof answers === "object" && Object.keys(answers).length > 0;
    const isDifferent =
      newProvided &&
      JSON.stringify(answers) !== JSON.stringify(submission.answers);

    // Tolak hanya jika jawaban sudah sama persis DAN skor sudah dihitung
    if (!isDifferent && submission.score && submission.score > 0) {
      return res.status(403).json({
        message: "Sesi ujian sudah berakhir dan jawaban telah tersimpan",
      });
    }

    // Hitung skor baru berdasarkan jawaban yang dikirim
    const questions = await Question.find({ quizId: submission.quizId });
    let score = 0;

    questions.forEach((q) => {
      const qId = q._id.toString();
      if (answers[qId] && answers[qId] === q.correctAnswer) {
        score += 1;
      }
    });

    submission.answers = answers;
    submission.score = score;
    // submittedAt & duration sudah ada; tidak diubah
    await submission.save();

    return res.status(200).json({
      message: "Jawaban berhasil diperbarui setelah auto-submit",
      result: submission,
      updatedAfterAutoSubmit: true,
    });
  }

  // Simpan jawaban (tanpa hitung skor)
  if (answers && typeof answers === "object") {
    submission.answers = answers;
    await submission.save();

    console.log(`✅ Answers saved for submission ${submissionId}`);
    res.status(200).json({
      message: "Jawaban berhasil disimpan",
      savedAt: new Date(),
    });
  } else {
    res.status(400).json({
      message: "Format jawaban tidak valid",
    });
  }
});

// @desc    Submit jawaban
// @route   POST /api/exam/submit/:submissionId
export const submitQuiz = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { answers } = req.body;

  // --- FIX ERROR "Cast to ObjectId failed for value null" ---
  // --- FIX ERROR TERMINAL: Cek Validitas ID ---
  if (!submissionId || !mongoose.Types.ObjectId.isValid(submissionId)) {
    // Jangan throw error 500, cukup return 400 bad request agar server tidak crash log
    return res.status(400).json({
      message: "ID Submission tidak valid atau hilang",
      error: "INVALID_SUBMISSION_ID",
    });
  }

  const submission = await Submission.findById(submissionId);

  if (!submission) {
    return res.status(404).json({
      message: "Sesi ujian tidak ditemukan atau telah dihapus",
      error: "SUBMISSION_NOT_FOUND",
    });
  }

  // Jika sudah completed, periksa apakah jawaban memang sudah tersimpan
  if (submission.status === "completed") {
    const existingAnswersEmpty =
      !submission.answers || Object.keys(submission.answers).length === 0;
    const newAnswersProvided = answers && Object.keys(answers).length > 0;

    // Kasus 1: Jawaban sudah ada → idempotent, tidak perlu update
    if (!existingAnswersEmpty) {
      return res.status(200).json({
        message: "Ujian telah selesai. Jawaban sudah dikumpulkan sebelumnya.",
        result: submission,
        alreadyCompleted: true,
      });
    }

    // Kasus 2: Auto-submit sebelumnya kosong, tapi sekarang client mengirim jawaban → perbarui
    if (existingAnswersEmpty && newAnswersProvided) {
      console.log(
        `ℹ️  Updating empty auto-submitted answers for submission ${submissionId}`
      );
    } else {
      // Tidak ada jawaban baru, tetap kembalikan response idempotent
      return res.status(200).json({
        message:
          "Ujian telah selesai. Tidak ada jawaban baru untuk diperbarui.",
        result: submission,
        alreadyCompleted: true,
      });
    }
  }
  // Validasi Kepemilikan
  // const userId = req.user._id;

  // if (submission.userId.toString() !== userId.toString()) {
  //   res.status(403);
  //   throw new Error("Akses ditolak.");
  // }

  // Proses Nilai
  const questions = await Question.find({ quizId: submission.quizId });
  let score = 0;

  questions.forEach((q) => {
    const qId = q._id.toString();

    if (answers[qId] && answers[qId] === q.correctAnswer) {
      score += 1; // Poin 1 per soal benar
    }
  });

  // Debugging (Opsional: Cek di terminal apakah skor terhitung)
  console.log("Jawaban Siswa:", answers);
  console.log("Skor Terhitung:", score);

  submission.answers = answers;
  submission.score = score;
  submission.submittedAt = new Date();
  submission.status = "completed";

  // Hitung durasi (pastikan tidak negatif)
  const duration = Math.max(
    0,
    new Date().getTime() - new Date(submission.startTime).getTime()
  );
  submission.duration = duration;

  await submission.save();

  res.status(200).json({
    message: "Berhasil submit",
    result: submission,
  });
});

// @desc    Get Leaderboard
export const getLeaderboard = asyncHandler(async (req, res) => {
  const quiz = await findQuizByCodeOrId(req.params.quizId);
  if (!quiz) {
    res.status(404);
    throw new Error("Kuis tidak ditemukan");
  }

  // Ambil hanya yang status completed, urutkan skor tertinggi & durasi tercepat
  const leaderboard = await Submission.find({
    quizId: quiz._id,
    status: "completed",
  })
    .sort({ score: -1, duration: 1 })
    .limit(100)
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

// @desc    Cek status kuis by Code/ID (Khusus Polling saat ujian)
// @route   GET /api/exam/check-status/:quizId
export const getQuizStatusById = asyncHandler(async (req, res) => {
  const { quizId } = req.params; // Ini bisa berupa CODE atau ID

  // PANGGIL HELPER SAJA (Lebih Rapi & Aman)
  const quiz = await findQuizByCodeOrId(quizId);

  if (!quiz) {
    res.status(404);
    throw new Error("Kuis tidak ditemukan");
  }

  res.json({ status: quiz.status });
});
