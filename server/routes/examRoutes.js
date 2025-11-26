import express from "express";
const router = express.Router();
import {
  startOrResumeQuiz,
  submitQuiz,
  getLeaderboard,
} from "../controllers/examController.js";
import { protect } from "../middlewares/authMiddleware.js"; // Hanya butuh login

// @route   POST /api/exam/start/:quizId
// Memulai (atau melanjutkan) kuis.
router.post("/start/:quizId", protect, startOrResumeQuiz);

// @route   POST /api/exam/submit/:submissionId
// Mengumpulkan jawaban final.
router.post("/submit/:submissionId", protect, submitQuiz);
router.get("/leaderboard/:quizId", protect, getLeaderboard);

export default router;
