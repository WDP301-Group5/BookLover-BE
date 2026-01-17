import mongoose from "mongoose";
import type { iComment } from "../interfaces/comment";

const commentSchema = new mongoose.Schema(
	{
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
		replyOf: { type: String },
		likes: { type: Number, default: 0 },
		dislikes: { type: Number, default: 0 },
		status: {
			type: String,
			enum: ["active", "deleted", "spam", "blocked"],
			default: "active",
		},
	},
	{ timestamps: true },
);

export const Comment = mongoose.model<iComment>("Comment", commentSchema);
