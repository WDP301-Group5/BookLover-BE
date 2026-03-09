import express from "express";
import {
	createComment,
	getCommentsByChapter,
	getReplyComments,
	replyToComment,
	updateComment,
} from "../controllers/commentController";
import { verifyToken } from "../middleware/auth";

const commentRouter = express.Router();

commentRouter.get("/chapter/:chapterId", getCommentsByChapter);
commentRouter.post("/chapter/:chapterId", verifyToken, createComment);
commentRouter.get("/reply/:commentId", getReplyComments);
commentRouter.post("/reply/:commentId", verifyToken, replyToComment);
commentRouter.put("/:commentId", verifyToken, updateComment);

export default commentRouter;
