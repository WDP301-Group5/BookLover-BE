export interface INotification {
	id: string;
	from: string | "system"; // có thể là từ hệ thống hay từ người dùng khác
	to: string; // userId của người nhận
	title: string;
	content: string;
	status: "read" | "unread";
	createdAt?: Date;
	updatedAt?: Date;
}
