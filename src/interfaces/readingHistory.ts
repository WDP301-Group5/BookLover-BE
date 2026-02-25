export interface IReadingHistory {
	id: string;
	userId: string;
	storyId: string;
	chapterNumber: number; // chỉ lưu chương lớn nhất
	createdAt?: Date;
	updatedAt?: Date;
}
