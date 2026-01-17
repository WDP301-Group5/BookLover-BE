import mongoose from "mongoose";
import type { IReview } from "../interfaces/review";

const reviewSchema = new mongoose.Schema(
	{
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
		status: {
			type: String,
			enum: ["active", "deleted", "spam", "blocked"],
			default: "active",
		},
	},
	{ timestamps: true },
);

export const Review = mongoose.model<IReview>("Review", reviewSchema);
