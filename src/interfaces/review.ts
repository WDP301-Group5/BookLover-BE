export interface IReview {
	id: string;
	userId: string;
	storyId: string;
	content: string;
	status: "active" | "deleted" | "spam" | "blocked";
	createdAt?: Date;
	updatedAt?: Date;
}
