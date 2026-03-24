export interface IReactReview {
  id: string;
  userId: string;
  reviewId: string;
  react: "unlike" | "like" | "love" | "haha" | "wow" | "sad" | "angry";
  createdAt?: Date;
  updatedAt?: Date;
}