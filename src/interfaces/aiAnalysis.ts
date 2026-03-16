import mongoose from "mongoose";

export interface IAIAnalysis {
	_id: mongoose.Types.ObjectId;
	chapterId: mongoose.Types.ObjectId;
	perspectiveScores?: {
		toxicity?: number;
		sexuallyExplicit?: number;
		violence?: number;
		identityAttack?: number;
		insult?: number;
		threat?: number;
	};
	geminiDecision?: {
		decision: "APPROVE" | "FLAG" | "REJECT";
		scores: {
			toxicity: number;
			sexual: number;
			violence: number;
			political: number;
		};
		reasons: string[];
		warnings?: string[];
	};
	finalDecision:
		| "auto-approved"
		| "flagged"
		| "auto-rejected"
		| "hard-filter-rejected";
	reasons: string[];
	processedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}
