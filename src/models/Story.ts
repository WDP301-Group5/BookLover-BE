import mongoose from "mongoose";
import type { IStory } from "../interfaces/story";

const storySchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		slug: {
			type: String,
			required: true,
		},
		image: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		authorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		topics: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "Topic",
			required: true,
		},
		tags: {
			type: [String],
			required: true,
		},
		status: {
			type: String,
			enum: ["active", "private", "draft", "pending", "rejected", "banned"],
			default: "draft",
		},
		isPremium: {
			type: Boolean,
			default: false,
		},
		isFinish: {
			type: Boolean,
			default: false,
		},
		views: {
			// tổng số lượt xem truyện
			type: Number,
			default: 0,
		},
		stars: {
			// tổng số sao
			type: Number,
			default: 0,
		},
		rates: {
			// tổng số lượt đánh giá
			type: Number,
			default: 0,
		},
		followers: {
			// số người theo dõi truyện
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	},
);

storySchema.index({ topics: 1, views: -1 });

export const Story = mongoose.model<IStory>("Story", storySchema);
