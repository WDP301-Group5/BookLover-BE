import mongoose from "mongoose";
import type { ITopic } from "../interfaces/topic";

const topicSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		description: { type: String, required: true },
		status: {
			type: String,
			enum: ["active", "inactive"],
			default: "active",
		},
	},
	{ timestamps: true },
);

export const Topic = mongoose.model<ITopic>("Topic", topicSchema);
