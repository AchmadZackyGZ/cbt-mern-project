import express from "express";
const router = express.Router();
import {
  createQuiz,
  deleteQuiz,
  getQuizzes,
  updateQuizStatus,
} from "../controllers/quizController.js";
import { protect, isAdmin } from "../middlewares/authMiddleware.js";

router
  .route("/")
  .post(protect, isAdmin, createQuiz)
  .get(protect, isAdmin, getQuizzes); // Tambah GET di sini

router.route("/:id").delete(protect, isAdmin, deleteQuiz); // Tambah DELETE route

router.route("/:id/status").put(protect, isAdmin, updateQuizStatus);

export default router;
