import { Comment } from "../models/Comment";
import notificationService from "./notificationService";

const CommentService = {
	async getCommentsByChapter(
		chapterId: string,
		offset: number = 0,
		limit: number = 20,
	) {
		try {
			const comments = await Comment.find({
				chapterId,
				status: "active",
				replyOf: null,
			})
				.sort({ createdAt: -1 })
				.skip(offset)
				.limit(limit)
				.populate("userId", "id nickName avatarURL")
				.lean();
			const totalComments = await Comment.countDocuments({
				chapterId,
				status: "active",
				replyOf: null,
			});
			const formatComments = comments.map((comment) => {
				return {
					...comment,
					id: comment._id.toString(),
					user: comment.userId,
				};
			});
			return { comments: formatComments, total: totalComments };
		} catch (error) {
			throw new Error(`Có lỗi xảy ra khi lấy danh sách bình luận: ${error}`);
		}
	},

	async createComment(chapterId: string, userId: string, content: string) {
		try {
			const data = {
				chapterId,
				userId,
				content,
			};
			const comment = await Comment.create(data);
			return comment;
		} catch (error) {
			throw new Error(`Có lỗi xảy ra khi tạo bình luận: ${error}`);
		}
	},

	async getReplyComments(commentId: string) {
		try {
			const comments = await Comment.find({
				replyOf: commentId,
				status: "active",
			})
				.populate("userId", "id nickName avatarURL")
				.lean();
			const totalComments = await Comment.countDocuments({
				replyOf: commentId,
				status: "active",
			});
			const formatComments = comments.map((comment) => {
				return {
					...comment,
					id: comment._id.toString(),
					user: comment.userId,
				};
			});
			return { comments: formatComments, total: totalComments };
		} catch (error) {
			throw new Error(
				`Có lỗi xảy ra khi lấy danh sách bình luận trả lời: ${error}`,
			);
		}
	},

	async replyToComment(commentId: string, userId: string, content: string) {
		try {
			const parentComment = await Comment.findById(commentId)
				.where("status")
				.equals("active")
				.lean();
			if (!parentComment) {
				throw new Error("Bình luận gốc không tồn tại.");
			}
			const data = {
				chapterId: parentComment.chapterId,
				userId,
				content,
				replyOf: commentId,
			};
			const comment = await Comment.create(data);
			await Comment.updateOne({ _id: commentId }, { $inc: { replyCount: 1 } });
			
			await notificationService.notifyCommentReplied({
				fromUserId: userId,
				toUserId: parentComment.userId.toString(),
				commentId: parentComment._id.toString(),
				chapterId: parentComment.chapterId.toString(),
				content,
			});

			return comment;
		} catch (error) {
			throw new Error(`Có lỗi xảy ra khi trả lời bình luận: ${error}`);
		}
	},

	async updateComment(commentId: string, userId: string, content: string) {
		try {
			const comment = await Comment.findOneAndUpdate(
				{ _id: commentId, userId },
				{ content },
				{ new: true },
			);
			return comment;
		} catch (error) {
			throw new Error(`Có lỗi xảy ra khi cập nhật bình luận: ${error}`);
		}
	},

	async updateIncreaseReactCommentCount(commentId: string, react: string) {
		try {
			const comment = await Comment.findOneAndUpdate(
				{ _id: commentId },
				{ $inc: { [`react.${react}`]: 1 } },
				{ new: true },
			);
			return comment;
		} catch (error) {
			throw new Error(`Có lỗi xảy ra khi cập nhật bình luận: ${error}`);
		}
	},

	async updateDecreaseReactCommentCount(commentId: string, react: string) {
		try {
			const comment = await Comment.findOneAndUpdate(
				{ _id: commentId },
				{ $inc: { [`react.${react}`]: -1 } },
				{ new: true },
			);
			return comment;
		} catch (error) {
			throw new Error(`Có lỗi xảy ra khi cập nhật bình luận: ${error}`);
		}
	},
};

export default CommentService;
