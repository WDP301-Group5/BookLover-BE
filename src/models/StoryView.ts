import mongoose from "mongoose";

const storyViewSchema = new mongoose.Schema(
	{
		storyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Story",
			required: true,
		},
		chapterId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Chapter",
			required: true,
		},
	},
	{ timestamps: true },
);

export const StoryView = mongoose.model("StoryView", storyViewSchema);
