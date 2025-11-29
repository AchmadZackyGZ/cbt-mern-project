import express from "express";
const router = express.Router();
import {
  startOrResumeQuiz,
  submitQuiz,
  getLeaderboard,
  checkQuizStatus,
  joinLobby,
} from "../controllers/examController.js";
import { protect } from "../middlewares/authMiddleware.js"; // Hanya butuh login

// @route   POST /api/exam/join/:quizCode
// Join lobby dan buat submission pending
router.post("/join/:quizCode", protect, joinLobby);

// @route   GET /api/exam/status/:quizCode
// Cek status quiz untuk polling
router.get("/status/:quizCode", protect, checkQuizStatus);

// @route   POST /api/exam/start/:quizId
// Memulai (atau melanjutkan) kuis.
router.post("/start/:quizId", protect, startOrResumeQuiz);

// @route   POST /api/exam/submit/:submissionId
// Mengumpulkan jawaban final.
router.post("/submit/:submissionId", protect, submitQuiz);

// @route   GET /api/exam/leaderboard/:quizId
// Mendapatkan leaderboard
router.get("/leaderboard/:quizId", protect, getLeaderboard);

export default router;
