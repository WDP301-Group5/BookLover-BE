import mongoose from "mongoose";

const storyViewSchema = new mongoose.Schema(
	{
		storyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Story",
			required: true,
		},
	},
	{ timestamps: true },
);

export const StoryView = mongoose.model("StoryView", storyViewSchema);
