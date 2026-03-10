import { ReactComment } from "../models/ReactComment";
import CommentService from "./commentService";

const ReactCommentService = {
	async getUserReactOfChapter(
		userId: string,
		chapterId: string,
		commentIds: string[],
	) {
		try {
			const result = await ReactComment.find({
				userId,
				chapterId,
				commentId: { $in: commentIds },
				react: { $ne: "unlike" },
			}).lean();
			const formatResult = result?.map((reactComment) => {
				return {
					...reactComment,
					id: reactComment._id.toString(),
				};
			});
			return formatResult;
		} catch (error) {
			throw new Error(
				"Có lỗi xảy ra khi lấy thông tin react của người dùng theo từng truyện từ database: " +
					error,
			);
		}
	},

	async userReactComment(
		userId: string,
		chapterId: string,
		commentId: string,
		react: string,
	) {
		const isExist = await ReactComment.findOne({
			userId,
			chapterId,
			commentId,
		});
		if (isExist) {
			const reactComment = await ReactComment.findOneAndUpdate(
				{ userId, chapterId, commentId },
				{ react },
				{ new: true },
			);
			if (react === "unlike") {
				await CommentService.updateDecreaseReactCommentCount(
					isExist.commentId,
					isExist.react,
				);
			} else {
				if (isExist.react !== "unlike") {
					await CommentService.updateDecreaseReactCommentCount(
						isExist.commentId,
						isExist.react,
					);
				}
				await CommentService.updateIncreaseReactCommentCount(
					isExist.commentId,
					react,
				);
			}
			return reactComment;
		} else {
			const newReactComment = new ReactComment({
				userId,
				chapterId,
				commentId,
				react,
			});
			await newReactComment.save();
			await CommentService.updateIncreaseReactCommentCount(commentId, react);
			return newReactComment;
		}
	},
};

export default ReactCommentService;
