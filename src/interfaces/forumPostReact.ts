export interface IForumPostReact {
	id: string;
	userId: string;
	forumCategoryId: string;
	forumPostId: string;
	react: "unlike" | "like" | "love" | "haha" | "wow" | "sad" | "angry";
	createdAt?: Date;
	updatedAt?: Date;
}
