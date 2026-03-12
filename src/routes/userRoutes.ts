import express from "express";
import { addNewReadingHistory, deleteHistory } from "../controllers/readingHistoryController";
import {
	followAuthor,
	getCommentHistory,
	getLast3History,
	getProfile,
	getPublicProfile,
	getPurchaseHistory,
	getReadingHistory,
	getRechargeHistory,
	getReviewHistory,
	searchUsers,
	updateProfile,
} from "../controllers/userController";
import { checkToken, verifyToken } from "../middleware/auth";
import { uploadAvatarAndBackground } from "../middleware/upload";

const userRouter = express.Router();

// TEST endpoint removed - use /admin/users instead
userRouter.get("/history/last3", checkToken, getLast3History);
userRouter.put("/history/reading", addNewReadingHistory);
userRouter.delete("/history/:historyId", checkToken, deleteHistory);
userRouter.get("/history/reading", checkToken, getReadingHistory);
userRouter.get("/history/comment", checkToken, getCommentHistory);
userRouter.get("/history/review", checkToken, getReviewHistory);
userRouter.get("/history/recharge", checkToken, getRechargeHistory);
userRouter.get("/history/purchase", checkToken, getPurchaseHistory);

userRouter.get("/profile", verifyToken, getProfile);
userRouter.put(
	"/profile",
	verifyToken,
	uploadAvatarAndBackground,
	updateProfile,
);
userRouter.get("/search", searchUsers);
userRouter.get("/:userId/public", getPublicProfile);
userRouter.post("/follow", verifyToken, followAuthor);

export default userRouter;
