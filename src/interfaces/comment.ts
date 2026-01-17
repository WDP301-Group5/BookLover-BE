export interface iComment {
	id: string;
	userId: string;
	chapterId: string;
	content: string;
	replyOf: string;
	likes: number;
	dislikes: number;
	status: "active" | "deleted" | "spam" | "blocked";
	// spam: bị báo cáo spam
	// blocked: bị báo cáo vi phạm chính sách
	createdAt?: Date;
	updatedAt?: Date;
}
