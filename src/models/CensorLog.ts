import mongoose from "mongoose";
import type { ICensorLog } from "../interfaces/censorLog";

const censorLogSchema = new mongoose.Schema(
	{
		targetType: {
			type: String,
			enum: ["Story", "Chapter"],
			required: true,
		},
		storyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Story",
		},
		chapterId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Chapter",
		},
		adminId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		action: {
			type: String,
			enum: ["approve", "reject", "ban", "unban"],
			required: true,
		},
		reason: {
			type: String,
		},
	},
	{
		timestamps: true,
	},
);

censorLogSchema.index({
	targetType: 1,
	storyId: 1,
	chapterId: 1,
	createdAt: -1,
});

export const CensorLog = mongoose.model<ICensorLog>(
	"CensorLog",
	censorLogSchema,
);
