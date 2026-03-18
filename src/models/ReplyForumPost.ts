import mongoose from "mongoose";
import { IReplyForumPost } from "../interfaces/replyForumPost";

const ReplyForumPostSchema = new mongoose.Schema(
  {
    id: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    forumPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumPost",
      required: true,
    },
    content: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

export const ReplyForumPost = mongoose.model<IReplyForumPost>(
  "ReplyForumPost",
  ReplyForumPostSchema,
);
