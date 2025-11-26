import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";

// @desc    Get all users (teams)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  // Ambil semua user tapi KECUALI yang role-nya admin (biar admin gak hapus diri sendiri)
  const users = await User.find({ role: "student" }).select("-password");
  res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.role === "admin") {
      res.status(400);
      throw new Error("Tidak bisa menghapus akun admin");
    }
    await user.deleteOne();
    res.json({ message: "User berhasil dihapus" });
  } else {
    res.status(404);
    throw new Error("User tidak ditemukan");
  }
});
