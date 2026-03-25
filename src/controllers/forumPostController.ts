import { Request, Response } from "express";
import { ERR_BAD_REQUEST, ERR_INTERNAL_SERVER } from "../consts/errorCode";
import { SUCCESS_OK } from "../consts/successCode";
import ForumPostReactService from "../services/ForumPostReactService";
import ForumPostService from "../services/ForumPostService";
import ReplyForumPostService from "../services/replyForumPostService";

export const getForumPostByForumCategoryId = async (
	req: Request,
	res: Response,
) => {
	try {
		const id = req.params.id;
		const { page = 1, limit = 20 } = req.query;
		const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
		if (!id || id == "undefined")
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Thiếu thông tin id bài viết" });
		const forum = await ForumPostService.getForumPostsOfForumCategory(
			id,
			offset,
			parseInt(limit as string),
		);
		res.status(SUCCESS_OK).json(forum);
	} catch (error) {
		res
			.status(ERR_INTERNAL_SERVER)
			.json({ message: "Error get forum", error: error });
	}
};

export const createForumPost = async (req: Request, res: Response) => {
	try {
		const userId = req.user ? req.user.userId : undefined;
		if (!userId) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Thiếu thông tin người dùng" });
		}
		const forumCategoryId = req.params?.forumCategoryId;
		if (!forumCategoryId) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Thiếu thông tin chủ đề bài viết" });
		}
		const { content } = req.body;
		const forumPost = await ForumPostService.createForumPost(
			forumCategoryId,
			userId,
			content,
		);
		res.status(SUCCESS_OK).json(forumPost);
	} catch (error) {
		res
			.status(ERR_INTERNAL_SERVER)
			.json({ message: "Error create forum post", error: error });
	}
};

export const getUserReactOfForumCategory = async (
	req: Request,
	res: Response,
) => {
	try {
		const forumCategoryId = req.params.forumCategoryId;
		const userId = req.user ? req.user.userId : undefined;
		if (!userId) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Thiếu thông tin người dùng" });
		}
		const forumCategory =
			await ForumPostReactService.getUserReactOfForumCategory(
				userId,
				forumCategoryId,
			);
		res.status(SUCCESS_OK).json(forumCategory);
	} catch (error) {
		res.status(ERR_INTERNAL_SERVER).json({
			message: "Error get user react of forum category",
			error: error,
		});
	}
};

export const userReactForumPost = async (req: Request, res: Response) => {
	try {
		const userId = req.user ? req.user.userId : undefined;
		if (!userId) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Thiếu thông tin người dùng" });
		}
		const { forumCategoryId } = req.params;
		if (!forumCategoryId || forumCategoryId == "undefined") {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Thiếu thông tin chủ đề bài viết" });
		}
		const { forumPostId, react } = req.body;
		if (
			!forumPostId ||
			forumPostId == "undefined" ||
			!react ||
			react == "undefined"
		) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Thiếu thông tin bài viết" });
		}
		const result = await ForumPostReactService.userReactForumPost(
			userId,
			forumCategoryId,
			forumPostId,
			react,
		);
		res.status(SUCCESS_OK).json(result);
	} catch (error) {
		res
			.status(ERR_INTERNAL_SERVER)
			.json({ message: "Error user react forum post", error: error });
	}
};

export const userReplyForumPost = async (req: Request, res: Response) => {
	try {
		const userId = req.user ? req.user.userId : undefined;
		if (!userId) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Thiếu thông tin người dùng" });
		}
		const { forumPostId } = req.params;
		if (!forumPostId || forumPostId == "undefined") {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Thiếu thông tin bài viết" });
		}
		const { content } = req.body;
		if (!content || content == "undefined") {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Thiếu thông tin bài viết" });
		}
		const result = await ReplyForumPostService.createReplyForumPost(
			userId,
			forumPostId,
			content,
		);
		res.status(SUCCESS_OK).json(result);
	} catch (error) {
		res
			.status(ERR_INTERNAL_SERVER)
			.json({ message: "Error user reply forum post", error: error });
	}
};

export const getReplyForumPosts = async (req: Request, res: Response) => {
	try {
		const forumPostId = req.params.forumPostId;
		if (!forumPostId || forumPostId == "undefined") {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Thiếu thông tin bài viết" });
		}
		const result = await ReplyForumPostService.getReplyForumPosts(forumPostId);
		res.status(SUCCESS_OK).json(result);
	} catch (error) {
		res
			.status(ERR_INTERNAL_SERVER)
			.json({ message: "Error get reply forum posts", error: error });
	}
};
