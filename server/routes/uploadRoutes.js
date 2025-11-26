import express from "express";
import multer from "multer";
import { storage } from "../config/cloudinary.js"; // Impor storage kita
import { protect, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();
const upload = multer({ storage }); // Inisialisasi Multer

// @desc    Upload gambar soal
// @route   POST /api/upload
// @access  Private/Admin
router.post("/", protect, isAdmin, upload.single("image"), (req, res) => {
  // 'image' harus sama dgn nama field di form-data
  if (!req.file) {
    res.status(400);
    throw new Error("Tidak ada file diupload");
  }

  // Jika sukses, Multer + Cloudinary sudah bekerja.
  // req.file.path akan berisi URL aman dari Cloudinary.
  res.status(201).json({
    message: "Gambar sukses diupload",
    imageUrl: req.file.path,
  });
});

export default router;
