export interface IReport {
	id: string;
	userId: string;
	type: "Comment" | "Chapter" | "Story";
	reportId: string; // id của comment hoặc chapter hoặc story
	content: string;
	status: "success" | "failed" | "pending"; // pending là đang chờ admin xử lý
	createdAt?: Date;
	updatedAt?: Date;
}
