import express from "express";
import { getUsers, deleteUser } from "../controllers/userController.js";
import { protect, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Endpoint ini DIPROTEKSI (Harus Login & Harus Admin)
router.route("/").get(protect, isAdmin, getUsers);
router.route("/:id").delete(protect, isAdmin, deleteUser);

export default router;
