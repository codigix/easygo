import express from "express";
import {
  login,
  getCurrentUser,
  logout,
} from "../controllers/authController.js";
import { changePassword } from "../controllers/changePasswordController.js";
import { authenticate } from "../middleware/auth.js";
import { getDb } from "../config/database.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);
router.post("/logout", authenticate, logout);
router.post("/change-password", authenticate, changePassword);

// Debug endpoints - REMOVE IN PRODUCTION
router.get("/health", (req, res) => {
  res.json({ success: true, message: "Backend is running" });
});

router.get("/debug/users", async (req, res) => {
  try {
    const db = getDb();
    const [users] = await db.query(
      "SELECT id, franchise_id, username, email, full_name, role, status FROM users LIMIT 10"
    );
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
