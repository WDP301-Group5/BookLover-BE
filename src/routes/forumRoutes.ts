import express from "express";
import {
	createForum,
	createForumCategory,
	getAllForums,
	getForumBySlug,
	getForumCategoryByForumSlug,
	getForumCategoryBySlug,
} from "../controllers/forumController";
import {
	createForumPost,
	getForumPostByForumCategoryId,
	getReplyForumPosts,
	getUserReactOfForumCategory,
	userReactForumPost,
	userReplyForumPost,
} from "../controllers/forumPostController";
import { checkToken } from "./../middleware/auth";
export const forumRouter = express.Router();

forumRouter.get("/all", getAllForums);
forumRouter.get("/one/:slug", getForumBySlug);
forumRouter.post("/create", checkToken, createForum);
forumRouter.post(
	"/category/post/:forumCategoryId",
	checkToken,
	createForumPost,
);
forumRouter.get("/category/post/:id", getForumPostByForumCategoryId);
forumRouter.get("/category/all/:slug", getForumCategoryByForumSlug);
forumRouter.get("/category/one/:slug", getForumCategoryBySlug);
forumRouter.get(
	"/category/react/:forumCategoryId",
	checkToken,
	getUserReactOfForumCategory,
);
forumRouter.post(
	"/category/react/:forumCategoryId",
	checkToken,
	userReactForumPost,
);
forumRouter.post(
	"/category/reply/:forumPostId",
	checkToken,
	userReplyForumPost,
);
forumRouter.get("/category/reply/:forumPostId", getReplyForumPosts);
forumRouter.post("/category", checkToken, createForumCategory);

export default forumRouter;
