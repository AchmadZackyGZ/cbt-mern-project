import asyncHandler from "express-async-handler";
import Question from "../models/questionModel.js";
import Quiz from "../models/quizModel.js"; // Untuk cek apakah quizId valid

// @desc    Membuat Soal baru
// @route   POST /api/questions
// @access  Private/Admin
export const createQuestion = asyncHandler(async (req, res) => {
  const { quizId, questionNumber, questionText, options, correctAnswer } =
    req.body;

  // Ambil data opsional
  const { imageUrl, tableData } = req.body;

  // Validasi dasar
  if (
    !quizId ||
    !questionNumber ||
    !questionText ||
    !options ||
    !correctAnswer
  ) {
    res.status(400);
    throw new Error("Semua field wajib diisi (kecuali gambar/tabel)");
  }

  // Cek apakah quizId-nya ada
  const quizExists = await Quiz.findById(quizId);
  if (!quizExists) {
    res.status(404);
    throw new Error("Kuis tidak ditemukan");
  }

  const question = await Question.create({
    quizId,
    questionNumber,
    questionText,
    imageUrl,
    tableData,
    options,
    correctAnswer,
  });

  res.status(201).json(question);
});

// @desc    Ambil semua soal berdasarkan Quiz ID
// @route   GET /api/questions/:quizId
// @access  Private/Admin
export const getQuestionsByQuizId = asyncHandler(async (req, res) => {
  const questions = await Question.find({ quizId: req.params.quizId }).sort({
    questionNumber: 1,
  }); // Urutkan berdasarkan nomor soal

  if (questions) {
    res.json(questions);
  } else {
    res.status(404);
    throw new Error("Soal tidak ditemukan");
  }
});
