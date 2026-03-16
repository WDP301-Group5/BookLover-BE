import mongoose from "mongoose";

export interface IOverrideFeedback {
	_id: mongoose.Types.ObjectId;
	chapterId: mongoose.Types.ObjectId;
	adminId: mongoose.Types.ObjectId;
	originalAIDecision:
		| "auto-approved"
		| "flagged"
		| "auto-rejected"
		| "hard-filter-rejected";
	finalDecision: "active" | "rejected";
	adminReason: string;
	overrideType: "approve_override" | "reject_override" | "filter_override";
	createdAt: Date;
	updatedAt: Date;
}
