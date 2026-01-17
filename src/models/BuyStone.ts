import mongoose from "mongoose";
import type { IBuyStone } from "../interfaces/buyStone.js";

const buyStoneSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		money: { type: Number, required: true, min: 0 },
		quantity: { type: Number, required: true, min: 0 },
		stoneBefore: { type: Number, required: true },
		stoneAfter: { type: Number, required: true },
		status: {
			type: String,
			enum: ["success", "failed", "pending"],
			default: "pending",
		},
	},
	{ timestamps: true },
);

export const BuyStone = mongoose.model<IBuyStone>("BuyStone", buyStoneSchema);
