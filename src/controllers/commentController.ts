import type { Request, Response } from "express";
import { ERR_INTERNAL_SERVER, ERR_UNAUTHORIZED } from "../consts/errorCode";
import { SUCCESS_CREATED, SUCCESS_OK } from "../consts/successCode";
import CommentService from "../services/commentService";

export const getCommentsByChapter = async (req: Request, res: Response) => {
	try {
		const { page = 1, limit = 20 } = req.query;
		const offset =
			(parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
		const comments = await CommentService.getCommentsByChapter(
			req.params.chapterId,
			offset,
			parseInt(limit as string, 10),
		);
		res.status(SUCCESS_OK).json(comments);
	} catch (error) {
		res
			.status(ERR_INTERNAL_SERVER)
			.json({ message: "Có lỗi xảy ra khi lấy các bình luận.", error });
	}
};

export const createComment = async (req: Request, res: Response) => {
	const userId = req.user ? req.user.userId : undefined;
	try {
		if (!userId) {
			return res
				.status(ERR_UNAUTHORIZED)
				.json({ message: "Bạn cần đăng nhập để bình luận." });
		}
		const comment = await CommentService.createComment(
			req.params.chapterId,
			userId,
			req.body.content,
		);
		res.status(SUCCESS_CREATED).json(comment);
	} catch (error) {
		res
			.status(ERR_INTERNAL_SERVER)
			.json({ message: "Có lỗi xảy ra khi tạo bình luận.", error });
	}
};

export const getReplyComments = async (req: Request, res: Response) => {
	try {
		const { comments, total } = await CommentService.getReplyComments(
			req.params.commentId,
		);
		res.status(SUCCESS_OK).json({ comments, total });
	} catch (error) {
		res
			.status(ERR_INTERNAL_SERVER)
			.json({ message: "Có lỗi xảy ra khi lấy các bình luận trả lời.", error });
	}
};

export const replyToComment = async (req: Request, res: Response) => {
	const userId = req.user ? req.user.userId : undefined;
	try {
		if (!userId) {
			return res
				.status(ERR_UNAUTHORIZED)
				.json({ message: "Bạn cần đăng nhập để trả lời bình luận." });
		}
		const comment = await CommentService.replyToComment(
			req.params.commentId,
			userId,
			req.body.content,
		);
		res.status(SUCCESS_CREATED).json(comment);
	} catch (error) {
		res
			.status(ERR_INTERNAL_SERVER)
			.json({ message: "Có lỗi xảy ra khi trả lời bình luận.", error: error });
	}
};

export const updateComment = async (req: Request, res: Response) => {
	const userId = req.user ? req.user.userId : undefined;
	try {
		if (!userId) {
			return res
				.status(ERR_UNAUTHORIZED)
				.json({ message: "Bạn cần đăng nhập để cập nhật bình luận." });
		}
		const comment = await CommentService.updateComment(
			req.params.commentId,
			userId,
			req.body.content,
		);
		res.status(SUCCESS_OK).json(comment);
	} catch (_error) {
		res
			.status(ERR_INTERNAL_SERVER)
			.json({ message: "Có lỗi xảy ra khi cập nhật bình luận." });
	}
};
