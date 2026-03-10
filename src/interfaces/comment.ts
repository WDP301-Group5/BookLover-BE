export interface iComment {
	id: string;
	userId: string;
	chapterId: string;
	content: string;
	replyCount: number;
	replyOf: string;
	react: {
		like: number;
		love: number;
		haha: number;
		wow: number;
		sad: number;
		angry: number;
	};
	status: "active" | "deleted" | "spam" | "blocked";
	// spam: bị báo cáo spam
	// blocked: bị báo cáo vi phạm chính sách
	createdAt?: Date;
	updatedAt?: Date;
}
