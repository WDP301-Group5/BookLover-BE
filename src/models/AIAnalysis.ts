import mongoose from "mongoose";
import type { IAIAnalysis } from "../interfaces/aiAnalysis.js";

const aiAnalysisSchema = new mongoose.Schema(
	{
		chapterId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Chapter",
			required: true,
		},
		perspectiveScores: {
			toxicity: Number,
			sexuallyExplicit: Number,
			violence: Number,
			identityAttack: Number,
			insult: Number,
			threat: Number,
		},
		geminiDecision: {
			decision: String,
			scores: {
				toxicity: Number,
				sexual: Number,
				violence: Number,
				political: Number,
			},
			reasons: [String],
			warnings: [String],
		},
		finalDecision: {
			type: String,
			enum: [
				"auto-approved",
				"flagged",
				"auto-rejected",
				"hard-filter-rejected",
			],
			required: true,
		},
		reasons: [String],
		processedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	},
);

aiAnalysisSchema.index({ chapterId: 1 });
aiAnalysisSchema.index({ processedAt: -1 });
aiAnalysisSchema.index({ finalDecision: 1 });

export const AIAnalysis = mongoose.model<IAIAnalysis>(
	"AIAnalysis",
	aiAnalysisSchema,
);
