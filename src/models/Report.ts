import mongoose from "mongoose";
import type { IReport } from "../interfaces/report";

const reportSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		type: {
			type: String,
			enum: ["Comment", "Chapter", "Story"],
			// các enum phải trùng tên model để type bên dưới có thể lấy đúng model
			required: true,
		},
		reportId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "type", // tự động bắt ref theo type
			required: true,
		},
		content: { type: String, required: true },
		status: {
			type: String,
			enum: ["success", "failed", "pending"],
			default: "pending",
		},
	},
	{ timestamps: true },
);

export const Report = mongoose.model<IReport>("Report", reportSchema);
