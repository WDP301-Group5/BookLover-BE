import mongoose from "mongoose";
import type { IFollowAuthor } from "../interfaces/followAuthor";

const followAuthorSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		authorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
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

export const FollowAuthor = mongoose.model<IFollowAuthor>(
	"FollowAuthor",
	followAuthorSchema,
);
