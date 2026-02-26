import mongoose from "mongoose";
import type { IGenre } from "../interfaces/genre.js";

const genreSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, unique: true },
		description: { type: String },
		avatar: { type: String, default: "" },
		status: {
			type: String,
			enum: ["active", "inactive"],
			default: "active",
		},
	},
	{
		timestamps: true,
	},
);

export const Genre = mongoose.model<IGenre>("Genre", genreSchema);
