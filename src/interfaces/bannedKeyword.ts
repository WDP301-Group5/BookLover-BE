import mongoose from "mongoose";

export interface IBannedKeyword {
	_id: mongoose.Types.ObjectId;
	text: string;
	category:
		| "profanity"
		| "political"
		| "spam"
		| "violence"
		| "sexual"
		| "other";
	severity: "critical" | "medium" | "low";
	isRegex: boolean;
	isActive: boolean;
	createdBy: mongoose.Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}
