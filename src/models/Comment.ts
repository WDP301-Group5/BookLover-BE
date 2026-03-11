import mongoose from "mongoose";
import type { iComment } from "../interfaces/comment";

const commentSchema = new mongoose.Schema(
	{
		id: String,
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		chapterId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Chapter",
			required: true,
		},
		content: { type: String, required: true },
		replyCount: { type: Number, default: 0 },
		replyOf: { type: String, default: null },
		react: {
			like: { type: Number, default: 0 },
			love: { type: Number, default: 0 },
			haha: { type: Number, default: 0 },
			wow: { type: Number, default: 0 },
			sad: { type: Number, default: 0 },
			angry: { type: Number, default: 0 },
		},
		status: {
			type: String,
			enum: ["active", "deleted", "spam", "blocked"],
			default: "active",
		},
	},
	{ timestamps: true },
);

commentSchema.index({ chapterId: 1, replyOf: 1, createdAt: -1 });

commentSchema.index({ replyOf: 1, createdAt: 1 });

commentSchema.index({ storyId: 1, createdAt: -1 });

export const Comment = mongoose.model<iComment>("Comment", commentSchema);
