export interface IForumPost {
	id: string;
	forumCategoryId: string;
	userId: string;
	content: string;
	replyCount: number;
	replyOf: string; // id của IForumPost mà nó reply
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
