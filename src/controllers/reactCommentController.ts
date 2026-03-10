import type { Request, Response } from "express";
import { ERR_BAD_REQUEST, ERR_INTERNAL_SERVER } from "../consts/errorCode";
import { SUCCESS_OK } from "../consts/successCode";
import ReactCommentService from "../services/reactCommentService";

export const getUserReactOfChapter = async (req: Request, res: Response) => {
	try {
		const userId = req.user ? req.user.userId : undefined;
		if (!userId) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Không có thông tin người dùng" });
		}
		const chapterId = req.params.chapterId;
		const commentIds =
			typeof req.query.commentIds === "string"
				? req.query.commentIds.split(",")
				: ([] as string[]);
		if (commentIds.length === 0) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Không có thông tin bình luận" });
		}
		const result = await ReactCommentService.getUserReactOfChapter(
			userId,
			chapterId,
			commentIds,
		);
		res.status(SUCCESS_OK).json(result);
	} catch (error) {
		res.status(ERR_INTERNAL_SERVER).json({
			message:
				"Có lỗi xảy ra khi lấy thông tin react của người dùng theo từng truyện.",
			error: error,
		});
	}
};

export const userReactComment = async (req: Request, res: Response) => {
	try {
		const userId = req.user ? req.user.userId : undefined;
		if (!userId) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Không có thông tin người dùng" });
		}
		const commentId = req.params.commentId;
		if (!commentId) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Không có thông tin bình luận" });
		}
		const { chapterId, react } = req.body;
		const result = await ReactCommentService.userReactComment(
			userId,
			chapterId,
			commentId,
			react,
		);
		res.status(SUCCESS_OK).json(result);
	} catch (error) {
		res
			.status(ERR_INTERNAL_SERVER)
			.json({ message: "Có lỗi xảy ra khi người dùng react", error: error });
	}
};
