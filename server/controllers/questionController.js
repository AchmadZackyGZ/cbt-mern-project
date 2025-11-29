import asyncHandler from "express-async-handler";
import Question from "../models/questionModel.js";
import Quiz from "../models/quizModel.js"; // Untuk cek apakah quizId valid
import mongoose from "mongoose";

// Helper function to find quiz by _id or examCode
const findQuizByIdOrCode = async (identifier) => {
  // Check if it's a valid ObjectId (24 hex characters)
  if (mongoose.Types.ObjectId.isValid(identifier) && identifier.length === 24) {
    return await Quiz.findById(identifier);
  } else {
    // Otherwise, search by examCode
    return await Quiz.findOne({ examCode: identifier });
  }
};

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

  // Cek apakah quizId-nya ada (support both _id and examCode)
  const quizExists = await findQuizByIdOrCode(quizId);
  if (!quizExists) {
    res.status(404);
    throw new Error("Kuis tidak ditemukan");
  }

  // Use the actual _id for database operations
  const actualQuizId = quizExists._id;

  const question = await Question.create({
    quizId: actualQuizId,
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
  const quizIdParam = req.params.quizId;

  // Find quiz by _id or examCode
  const quiz = await findQuizByIdOrCode(quizIdParam);
  if (!quiz) {
    res.status(404);
    throw new Error("Kuis tidak ditemukan");
  }

  // Use the actual _id for database operations
  const actualQuizId = quiz._id;

  const questions = await Question.find({ quizId: actualQuizId }).sort({
    questionNumber: 1,
  }); // Urutkan berdasarkan nomor soal

  if (questions) {
    res.json(questions);
  } else {
    res.status(404);
    throw new Error("Soal tidak ditemukan");
  }
});

// @desc    Update soal
// @route   PUT /api/questions/:id
// @access  Private/Admin
export const updateQuestion = asyncHandler(async (req, res) => {
  const { questionNumber, questionText, imageUrl, options, correctAnswer } =
    req.body;

  const question = await Question.findById(req.params.id);

  if (question) {
    question.questionNumber = questionNumber || question.questionNumber;
    question.questionText = questionText || question.questionText;
    question.imageUrl = imageUrl || question.imageUrl;
    question.options = options || question.options;
    question.correctAnswer = correctAnswer || question.correctAnswer;

    const updatedQuestion = await question.save();
    res.json(updatedQuestion);
  } else {
    res.status(404);
    throw new Error("Soal tidak ditemukan");
  }
});
