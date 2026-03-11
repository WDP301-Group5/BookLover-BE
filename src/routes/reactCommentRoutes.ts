import express from "express";
import {
	getUserReactOfChapter,
	userReactComment,
} from "../controllers/reactCommentController";
import { checkToken } from "../middleware/auth";

const reactCommentRouter = express.Router();

reactCommentRouter.get(
	"/user/chapter/:chapterId",
	checkToken,
	getUserReactOfChapter,
);
reactCommentRouter.post(
	"/user/comment/:commentId",
	checkToken,
	userReactComment,
);

export default reactCommentRouter;
