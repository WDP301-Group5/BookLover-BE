export interface IReview {
	id: string;
	userId: string;
	storyId: string;
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
	createdAt?: Date;
	updatedAt?: Date;
}
