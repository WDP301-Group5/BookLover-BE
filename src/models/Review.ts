// src/models/Review.ts
import mongoose from "mongoose";
import type { IReview } from "../interfaces/review";

const reviewSchema = new mongoose.Schema(
	{
		id: String,
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		storyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Story",
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
reviewSchema.index({ chapterId: 1, replyOf: 1, createdAt: -1 });

reviewSchema.index({ replyOf: 1, createdAt: 1 });

reviewSchema.index({ storyId: 1, createdAt: -1 });

export const Review = mongoose.model<IReview>("Review", reviewSchema);
