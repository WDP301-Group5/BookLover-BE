import mongoose from "mongoose";
import type { IReactReview } from "../interfaces/reactReview";

const reactReviewSchema = new mongoose.Schema(
	{
		id: String,
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		reviewId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Review",
			required: true,
		},
		react: {
			type: String,
			enum: ["unlike", "like", "love", "haha", "wow", "sad", "angry"],
			required: true,
			default: "like",
		},
	},
	{ timestamps: true },
);

reactReviewSchema.index({ userId: 1, reviewId: 1 }, { unique: true });
reactReviewSchema.index({ reviewId: 1 });

export const ReactReview = mongoose.model<IReactReview>(
	"ReactReview",
	reactReviewSchema,
);
