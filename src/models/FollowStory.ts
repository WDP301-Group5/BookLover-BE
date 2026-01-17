import mongoose from "mongoose";
import type { IFollowStory } from "../interfaces/followStory";

const followStorySchema = new mongoose.Schema(
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
		status: {
			type: String,
			enum: ["follow", "unsend", "unfollow"],
			default: "follow",
		},
	},
	{ timestamps: true },
);

export const FollowStory = mongoose.model<IFollowStory>(
	"FollowStory",
	followStorySchema,
);
