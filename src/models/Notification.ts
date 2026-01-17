import mongoose from "mongoose";
import type { INotification } from "../interfaces/notification";

const notificationSchema = new mongoose.Schema(
	{
		from: {
			type: String,
			required: true,
		},
		to: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		title: { type: String, required: true },
		content: { type: String, required: true },
		status: {
			type: String,
			enum: ["read", "unread"],
			default: "unread",
		},
	},
	{ timestamps: true },
);

export const Notification = mongoose.model<INotification>(
	"Notification",
	notificationSchema,
);
