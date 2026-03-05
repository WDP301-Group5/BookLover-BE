import express from "express";
import { addNewReadingHistory } from "../controllers/readingHistoryController";
import {
	getAllUsers,
	getLast3History,
	getProfile,
	updateProfile,
} from "../controllers/userController";
import { verifyToken } from "../middleware/auth";
import { uploadAvatarAndBackground } from "../middleware/upload";

const userRouter = express.Router();

// TEST
userRouter.get("/test", getAllUsers);
userRouter.get("/history/last3", getLast3History);
userRouter.put("/history/reading", addNewReadingHistory);

userRouter.get("/profile", verifyToken, getProfile);
userRouter.put(
	"/profile",
	verifyToken,
	uploadAvatarAndBackground,
	updateProfile,
);

export default userRouter;
