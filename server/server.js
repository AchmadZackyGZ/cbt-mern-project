import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// inisialisasi app
const app = express();

//middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/users", userRoutes);

// koneksi ke database
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Tersambung ke MongoDB...");
    app.listen(PORT, () => {
      console.log(`Server berjalan di port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Koneksi DB Gagal:", err.message);
  });
