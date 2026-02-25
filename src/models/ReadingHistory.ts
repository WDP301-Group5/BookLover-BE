import mongoose from "mongoose";
import type { IReadingHistory } from "../interfaces/readingHistory";

const readinghistorySchema = new mongoose.Schema(
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
		chapterNumber: {
			type: Number,
			required: true,
		},
	},
	{ timestamps: true },
);

readinghistorySchema.index({ userId: 1, updatedAt: -1 });

export const ReadingHistory = mongoose.model<IReadingHistory>(
	"ReadingHistory",
	readinghistorySchema,
);
