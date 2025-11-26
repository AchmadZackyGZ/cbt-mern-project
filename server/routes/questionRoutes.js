import express from "express";
const router = express.Router();
import {
  createQuestion,
  getQuestionsByQuizId,
} from "../controllers/questionController.js";
import { protect, isAdmin } from "../middlewares/authMiddleware.js";

// URL: POST /api/questions
router.post("/", protect, isAdmin, createQuestion);

// URL: /api/questions/:quizId
router.route("/:quizId").get(protect, isAdmin, getQuestionsByQuizId);

export default router;
