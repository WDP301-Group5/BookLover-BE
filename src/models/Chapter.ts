import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
	{
		storyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Story",
			required: true,
		},
		chapterNumber: {
			type: Number,
			required: true,
			min: 0,
		},
		title: {
			type: String,
			required: true,
		},
		contentURL: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			enum: ["active", "inactive", "draft"],
			default: "draft",
		},
	},
	{
		timestamps: true,
	},
);

export const Chapter = mongoose.model("Chapter", chapterSchema);
