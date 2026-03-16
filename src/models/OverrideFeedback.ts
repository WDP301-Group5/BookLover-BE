import mongoose from "mongoose";
import type { IOverrideFeedback } from "../interfaces/overrideFeedback.js";

const overrideFeedbackSchema = new mongoose.Schema(
	{
		chapterId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Chapter",
			required: true,
		},
		adminId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		originalAIDecision: {
			type: String,
			enum: [
				"auto-approved",
				"flagged",
				"auto-rejected",
				"hard-filter-rejected",
			],
			required: true,
		},
		finalDecision: {
			type: String,
			enum: ["active", "rejected"],
			required: true,
		},
		adminReason: {
			type: String,
			required: true,
		},
		overrideType: {
			type: String,
			enum: ["approve_override", "reject_override", "filter_override"],
			required: true,
		},
	},
	{
		timestamps: true,
	},
);

overrideFeedbackSchema.index({ chapterId: 1 });
overrideFeedbackSchema.index({ adminId: 1 });
overrideFeedbackSchema.index({ createdAt: -1 });

export const OverrideFeedback = mongoose.model<IOverrideFeedback>(
	"OverrideFeedback",
	overrideFeedbackSchema,
);
