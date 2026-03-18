import mongoose from "mongoose";
import { IForumCategory } from "../interfaces/forumCategory";
import { listKey } from "../interfaces/forum";

const forumCategorySchema = new mongoose.Schema(
  {
    id: String,
    forumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Forum",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: listKey,
      required: true,
    },
    storyId: {
      type: mongoose.Schema.Types.ObjectId || String,
      required: function () {
        return this.type === "story";
      },
      ref: "Story",
    },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, required: true },
    view: { type: Number, required: true, default: 0 },
    post: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

forumCategorySchema.index({ forumId: 1, createdAt: -1 });

export const ForumCategory = mongoose.model<IForumCategory>(
  "ForumCategory",
  forumCategorySchema,
);
