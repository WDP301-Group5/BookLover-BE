import express from "express";
import {
	confirmPasswordResetController,
	googleLoginController,
	login,
	register,
	requestPasswordResetController,
	resendVerificationController,
	verifyEmailController,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.get("/verify-email", verifyEmailController);
router.post("/resend-verification", resendVerificationController);
router.post("/login", login);
router.post("/google-login", googleLoginController);
router.post("/password-reset-request", requestPasswordResetController);
router.post("/password-reset-confirm", confirmPasswordResetController);

export default router;
