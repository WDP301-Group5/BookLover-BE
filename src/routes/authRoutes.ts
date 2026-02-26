import express from "express";
import { googleLoginController, login } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/google-login", googleLoginController);

export default router;
