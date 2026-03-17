import express from "express";
import { addNewReadingHistory, deleteHistory, getReadingHistoryByStory } from "../controllers/readingHistoryController";
import {
	getFollowers,
	getFollowing,
	getCommentHistory,
	getLast3History,
	getProfile,
	getPublicProfile,
	getPurchaseHistory,
	getReadingHistory,
	getRechargeHistory,
	getReviewHistory,
	searchUsers,
	toggleFollowProfile,
	updateProfile,
	changePasswordController,
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
userRouter.get("/history/reading/:storyId", checkToken, getReadingHistoryByStory);

userRouter.get("/profile", verifyToken, getProfile);
userRouter.put(
  "/profile",
  verifyToken,
  uploadAvatarAndBackground,
  updateProfile,
);
userRouter.get("/search", checkToken, searchUsers);
userRouter.post("/change-password", verifyToken, changePasswordController);
userRouter.get("/:id/profile", checkToken, getPublicProfile);

//FOLLOW
// userRouter.post("/:id/follow", verifyToken, toggleFollow);
userRouter.post("/:id/follow", verifyToken, toggleFollowProfile);
userRouter.get("/:id/followers", checkToken, getFollowers);
userRouter.get("/:id/following", checkToken, getFollowing);

export default userRouter;
