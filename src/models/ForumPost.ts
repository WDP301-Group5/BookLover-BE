import mongoose from "mongoose";
import { IForumPost } from "../interfaces/forumPost";

const forumPostSchema = new mongoose.Schema(
	{
		id: String,
		forumCategoryId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "ForumCategory",
			required: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		content: { type: String, required: true },
		replyCount: { type: Number, default: 0 },
		replyOf: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "ForumPost",
		},
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

forumPostSchema.index({ forumCategoryId: 1, createdAt: -1 });
forumPostSchema.index({ replyOf: 1 });

export const ForumPost = mongoose.model<IForumPost>(
	"ForumPost",
	forumPostSchema,
);
