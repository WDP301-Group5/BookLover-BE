import mongoose from "mongoose";
import type { IReportLog } from "../interfaces/reportLog.js";

const reportLogSchema = new mongoose.Schema(
	{
		reportId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Report",
			required: true,
		},
		adminId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		action: {
			type: String,
			enum: [
				"dismiss",
				"acknowledge",
				"ban_story",
				"delete_chapter",
				"delete_comment",
				"warn_user",
				"ban_user",
			],
			required: true,
		},
		note: { type: String },
		metadata: {
			storyBanned: { type: Boolean },
			chapterDeleted: { type: Boolean },
			commentDeleted: { type: Boolean },
			userWarned: { type: Boolean },
			userBanned: { type: Boolean },
		},
	},
	{ timestamps: true },
);

// Index for efficient querying by reportId
reportLogSchema.index({ reportId: 1, createdAt: -1 });

export const ReportLog = mongoose.model<IReportLog>(
	"ReportLog",
	reportLogSchema,
);
