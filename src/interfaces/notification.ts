import type { Document, Types } from "mongoose";

export type NotificationType =
	| "user_followed_you"
	| "story_approved"
	| "new_story_followed_author"
	| "chapter_approved"
	| "new_chapter_followed_story"
	| "system"
	| "warning";
export interface INotification extends Document {
	id: string;
	from?: Types.ObjectId | "system"; // có thể là từ hệ thống hay từ người dùng khác
	to: Types.ObjectId; // userId của người nhận
	type: NotificationType;
	title: string;
	content: string;
	status: "read" | "unread";
	data?: Record<string, any>;
	createdAt?: Date;
	updatedAt?: Date;
}
