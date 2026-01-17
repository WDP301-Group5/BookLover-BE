import mongoose from "mongoose";
import type { ITransaction } from "../interfaces/transaction";

const transactionSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		planId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "SubcriptionPlan",
			required: true,
		},
		spiritStones: { type: Number, required: true, min: 0 },
		stoneBefore: { type: Number, required: true, min: 0 },
		stoneAfter: { type: Number, required: true, min: 0 },
		status: {
			type: String,
			enum: ["success", "failed", "pending"],
			default: "pending",
		},
	},
	{ timestamps: true },
);

export const Transaction = mongoose.model<ITransaction>(
	"Transaction",
	transactionSchema,
);
