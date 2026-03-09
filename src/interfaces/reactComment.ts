export interface IReactComment {
	id: string;
	userId: string;
	chapterId: string;
	commentId: string;
	react: "unlike" | "like" | "love" | "haha" | "wow" | "sad" | "angry";
	// unlike là đã react nhưng lại bỏ react
	createdAt?: Date;
	updatedAt?: Date;
}
