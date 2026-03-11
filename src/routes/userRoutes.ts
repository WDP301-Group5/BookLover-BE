import express from "express";
import { addNewReadingHistory, deleteHistory } from "../controllers/readingHistoryController";
import {
	getFollowers,
	getFollowing,
	getLast3History,
	getProfile,
	getPublicProfile,
	searchUsers,
	toggleFollowProfile,
	updateProfile,
} from "../controllers/userController";
import { checkToken, verifyToken } from "../middleware/auth";
import { uploadAvatarAndBackground } from "../middleware/upload";

const userRouter = express.Router();

// TEST endpoint removed - use /admin/users instead
userRouter.get("/history/last3", checkToken, getLast3History);
userRouter.put("/history/reading", addNewReadingHistory);
userRouter.delete("/history/:historyId", checkToken, deleteHistory);

userRouter.get("/profile", verifyToken, getProfile);
userRouter.put(
	"/profile",
	verifyToken,
	uploadAvatarAndBackground,
	updateProfile,
);
userRouter.get("/search", searchUsers);
userRouter.get("/:id/profile", checkToken, getPublicProfile);

//FOLLOW
// userRouter.post("/:id/follow", verifyToken, toggleFollow);
userRouter.post("/:id/follow", verifyToken, toggleFollowProfile);
userRouter.get("/:id/followers", checkToken, getFollowers);
userRouter.get("/:id/following", checkToken, getFollowing);

export default userRouter;
