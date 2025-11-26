import asyncHandler from "express-async-handler";
import Quiz from "../models/quizModel.js";

// @desc    Membuat Kuis baru
// @route   POST /api/quizzes
// @access  Private/Admin
export const createQuiz = asyncHandler(async (req, res) => {
  const { title, description, durationInMinutes } = req.body;

  if (!title || !durationInMinutes) {
    res.status(400);
    throw new Error("Title dan durasi wajib diisi");
  }

  const quiz = await Quiz.create({
    title,
    description,
    durationInMinutes,
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
