import express from "express";
import { addNewReadingHistory, deleteHistory } from "../controllers/readingHistoryController";
import {
  followAuthor,
  getLast3History,
  getProfile,
  getPublicProfile,
  searchUsers,
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
userRouter.post("/change-password", verifyToken, changePasswordController);

export default userRouter;
