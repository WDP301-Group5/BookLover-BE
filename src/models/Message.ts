import mongoose from "mongoose";
import { IMessage } from "../interfaces/message";

const messageSchema = new mongoose.Schema(
  {
    id: String,
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true }
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>("Message", messageSchema);
