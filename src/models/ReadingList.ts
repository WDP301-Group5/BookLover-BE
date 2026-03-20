import mongoose from "mongoose";
import type { IReadingList } from "../interfaces/readingList.js";

const readingListSchema = new mongoose.Schema(
  {
    id: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    stories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Story",
      },
    ],
  },
  { timestamps: true },
);

readingListSchema.index({ userId: 1, createdAt: -1 });

export const ReadingList = mongoose.model<IReadingList>(
  "ReadingList",
  readingListSchema,
);
