import express from "express";
import {
  googleLoginController,
  login,
  register,
  resendVerificationController,
  verifyEmailController,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.get("/verify-email", verifyEmailController);
router.post("/resend-verification", resendVerificationController);
router.post("/login", login);
router.post("/google-login", googleLoginController);

export default router;
