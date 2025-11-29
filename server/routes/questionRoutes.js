import express from "express";
const router = express.Router();
import {
  createQuestion,
  getQuestionsByQuizId,
  updateQuestion,
} from "../controllers/questionController.js";
import { protect, isAdmin } from "../middlewares/authMiddleware.js";

// URL: POST /api/questions
router.route("/").post(protect, isAdmin, createQuestion);

// URL: /api/questions/:quizId
router.route("/:quizId").get(protect, isAdmin, getQuestionsByQuizId);

// URL: PUT /api/questions/:id
router.route("/:id").put(protect, isAdmin, updateQuestion);

export default router;
