import mongoose from "mongoose";
import type { INotification } from "../interfaces/notification";

const notificationSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.Mixed,
      ref: "User",
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "story_approved",
        "chapter_approved",
        "new_story_from_followed_author",
        "new_chapter_from_followed_story",
        "user_followed_you",
        "system",
        "warning",
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ["read", "unread"],
      default: "unread",
      index: true,
    },
    data: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);

notificationSchema.index({ to: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
