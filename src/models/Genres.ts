// src/models/Genre.ts
import mongoose from "mongoose";
import type { Genre } from "../interfaces/genres";

const genreSchema = new mongoose.Schema<Genre>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      required: false, // có thể null nếu chưa có hình
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    __v: {
      type: Number,
      select: false, // thường không cần trả về cho client
    },
  },
  {
    timestamps: true, // tạo createdAt và updatedAt tự động
  }
);

// Index nếu cần tìm kiếm theo name
genreSchema.index({ name: 1 });

export const GenreModel = mongoose.model<Genre>("Genre", genreSchema);