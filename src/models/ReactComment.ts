import mongoose from "mongoose";
import type { IReactComment } from "../interfaces/reactComment";

const reactCommentSchema = new mongoose.Schema(
	{
		id: String,
		userId: { type: mongoose.Schema.Types.ObjectId, required: true },
		chapterId: { type: mongoose.Schema.Types.ObjectId, required: true },
		commentId: { type: mongoose.Schema.Types.ObjectId, required: true },
		react: {
			type: String,
			enum: ["unlike", "like", "love", "haha", "wow", "sad", "angry"],
			required: true,
			default: "like",
		},
	},
	{ timestamps: true },
);

reactCommentSchema.index({ userId: 1, commentId: 1 }, { unique: true });
reactCommentSchema.index({ chapterId: 1 });

export const ReactComment = mongoose.model<IReactComment>(
	"ReactComment",
	reactCommentSchema,
);
