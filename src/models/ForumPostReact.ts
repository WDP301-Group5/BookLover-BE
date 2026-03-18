import mongoose from "mongoose";
import { IForumPostReact } from "../interfaces/forumPostReact";

const ForumPostReactSchema = new mongoose.Schema(
  {
    id: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    forumCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumCategory",
      required: true,
    },
    forumPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumPost",
      required: true,
    },
    react: {
      type: String,
      enum: ["unlike", "like", "love", "haha", "wow", "sad", "angry"],
      required: true,
      default: "like",
    },
  },
  { timestamps: true },
);

export const ForumPostReact = mongoose.model<IForumPostReact>(
  "ForumPostReact",
  ForumPostReactSchema,
);
