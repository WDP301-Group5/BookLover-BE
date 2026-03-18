import mongoose from "mongoose";
import type { ITransaction } from "../interfaces/transaction";

const transactionSchema = new mongoose.Schema(
	{
		id: String,
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		chapterId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Chapter",
			required: true,
		},
		spiritStones: { type: Number, required: true, min: 0 },
		stoneBefore: { type: Number, required: true, min: 0 },
		stoneAfter: { type: Number, required: true, min: 0 },
		status: {
			type: String,
			enum: ["success", "failed", "pending"],
			default: "success",
		},

		type: {
			type: String,
			enum: ["topup", "chapter_purchase"],
			required: true,
		},

		adminShare: { type: Number, default: 0, min: 0 },
		authorShare: { type: Number, default: 0, min: 0 },

		description: { type: String, default: "" },
	},
	{ timestamps: true },
);

transactionSchema.index({ userId: 1, chapterId: 1 }, { unique: true });

transactionSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const Transaction = mongoose.model<ITransaction>(
	"Transaction",
	transactionSchema,
);
