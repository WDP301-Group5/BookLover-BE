// src/models/Chapter.ts
import mongoose from "mongoose";
import type { IChapter } from "../interfaces/chapter";

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
		isPremium: {
			type: Boolean,
			default: false,
		},
		price: {
			type: Number,
			default: 0,
			min: 0,
		},
		contentURL: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			enum: [
				"active",
				"inactive",
				"draft",
				"error",
				"pending",
				"rejected",
				"banned",
				"private",
			],
			default: "draft",
		},
		wordCount: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
	},
);

// Ensure unique chapter numbers per story
chapterSchema.index({ storyId: 1, chapterNumber: 1 }, { unique: true });

export const Chapter = mongoose.model<IChapter>("Chapter", chapterSchema);
