import mongoose from "mongoose";
import { IForum, listKey } from "../interfaces/forum";

const forumSchema = new mongoose.Schema(
  // hiện có 4 chủ đề lớn
  // tất cả sẽ do admin tạo và quản lý
  {
    id: String,
    slug: { type: String, required: true, unique: true },
    key: {
      type: String,
      required: true,
      unique: true,
      enum: listKey,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

export const Forum = mongoose.model<IForum>("Forum", forumSchema);
