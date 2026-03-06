import mongoose from "mongoose";

export interface ICensorLog {
  id: string;
  targetType: "Story" | "Chapter";
  storyId?: mongoose.Types.ObjectId;
  chapterId?: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  action: "approve" | "reject" | "ban" | "unban";
  reason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
