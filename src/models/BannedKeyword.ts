import mongoose from "mongoose";
import type { IBannedKeyword } from "../interfaces/bannedKeyword.js";

const bannedKeywordSchema = new mongoose.Schema(
	{
		text: {
			type: String,
			required: true,
			trim: true,
		},
		category: {
			type: String,
			required: true,
			enum: ["profanity", "political", "spam", "violence", "sexual", "other"],
			default: "other",
		},
		severity: {
			type: String,
			required: true,
			enum: ["critical", "medium", "low"],
			default: "medium",
		},
		isRegex: {
			type: Boolean,
			default: false,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	},
	{
		timestamps: true,
	},
);

bannedKeywordSchema.index({ text: 1 });
bannedKeywordSchema.index({ category: 1 });
bannedKeywordSchema.index({ isActive: 1 });

export const BannedKeyword = mongoose.model<IBannedKeyword>(
	"BannedKeyword",
	bannedKeywordSchema,
);
