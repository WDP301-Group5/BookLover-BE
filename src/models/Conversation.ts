import mongoose from "mongoose";
import { IConversation } from "../interfaces/Conversation";
import { lutimes } from "node:fs";

const conversationSchema = new mongoose.Schema(
  {
    id: String,
    members: {
      type: [
        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      ],
      limit: 2, // để limit là 2 để chỉ nhắn tin cho author
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true },
);

conversationSchema.index({ members: 1, updatedAt: -1 });

export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema,
);
