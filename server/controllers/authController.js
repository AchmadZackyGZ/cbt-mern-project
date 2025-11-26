import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

// fungsi untuk membuat token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });
};

// register pengguna baru
export const register = async (req, res) => {
  const { email, password, namaTeam, namaKetuaTeam, asalSekolah, role } =
    req.body;

  // Validasi input dasar
  if (!email || !password || !namaTeam || !asalSekolah || !namaKetuaTeam) {
    return res.status(400).json({
      message:
        "Email, password, nama team, nama ketua team, dan asal sekolah wajib diisi",
    });
  }

  try {
    // 1. Cek apakah email sudah ada
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    const teamExists = await User.findOne({ namaTeam });
    if (teamExists) {
      return res.status(400).json({ message: "Nama team sudah digunakan" });
    }

    // 3. Buat user baru (password akan otomatis di-hash)
    const user = await User.create({
      email,
      password,
      namaTeam,
      namaKetuaTeam,
      asalSekolah,
      role, // 'admin' atau 'student'
    });

    // 4. Kirim respon sukses
    res.status(201).json({
      message: "Registrasi team berhasil",
      user: {
        _id: user._id,
        email: user.email,
        namaTeam: user.namaTeam,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// login pengguna
export const login = async (req, res) => {
  const { email, password } = req.body; // <-- Diubah ke email

  try {
    // 1. Cari user berdasarkan email
    const user = await User.findOne({ email }); // <-- Diubah ke email
    if (!user) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    // 2. Bandingkan password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    // 3. Buat token
    const token = createToken(user._id);

    // 4. Kirim token dan data user
    res.status(200).json({
      message: "Login sukses",
      token,
      user: {
        _id: user._id,
        email: user.email,
        namaTeam: user.namaTeam,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
