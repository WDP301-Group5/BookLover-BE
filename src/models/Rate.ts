import mongoose from "mongoose";
import type { IRate } from "../interfaces/rate";

const rateSchema = new mongoose.Schema(
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
		rate: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},
	},
	{ timestamps: true },
);

rateSchema.index({ userId: 1, storyId: 1 }, { unique: true });

export const Rate = mongoose.model<IRate>("Rate", rateSchema);
