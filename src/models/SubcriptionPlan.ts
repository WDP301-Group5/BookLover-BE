import mongoose from "mongoose";
import type { ISubcriptionPlan } from "../interfaces/subcriptionPlan";

const subcriptionPlanSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		level: { type: Number, required: true, min: 1, max: 10 },
		features: { type: [String], required: true },
		description: { type: String, required: true },
		spiritStones: { type: Number, required: true },
		extendedTime: { type: String, required: true },
		status: {
			type: String,
			enum: ["active", "inactive", "pending"],
			default: "active",
		},
	},
	{ timestamps: true },
);

export const SubcriptionPlan = mongoose.model<ISubcriptionPlan>(
	"SubcriptionPlan",
	subcriptionPlanSchema,
);
