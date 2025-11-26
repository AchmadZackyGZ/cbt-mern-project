import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";

// --- Middleware 1: PROTECT (Mengecek apakah user sudah login) ---
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Cek header 'Authorization' dan format 'Bearer <token>'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 2. Ambil token
      token = req.headers.authorization.split(" ")[1];

      // 3. Verifikasi token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Ambil data user dari DB (tanpa password) dan tempel ke 'req'
      // Ini penting agar semua rute yang diproteksi punya akses ke data user
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        res.status(401);
        throw new Error("User tidak ditemukan");
      }

      next(); // lanjut ke rute selanjutnya
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Tidak terotorisasi, token gagal");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Tidak terotorisasi, tidak ada token");
  }
});

// --- Middleware 2: IS ADMIN (Mengecek apakah user adalah admin) ---
// Ini HARUS dijalankan SETELAH 'protect'
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403); // 403 = Forbidden (Dilarang)
    throw new Error("Tidak terotorisasi sebagai admin");
  }
};

export { protect, isAdmin };
