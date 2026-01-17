export interface IReadingHistory {
	id: string;
	userId: string;
	storyId: string;
	chapterNumber: string; // chỉ lưu chương lớn nhất
	createdAt?: Date;
	updatedAt?: Date;
}
