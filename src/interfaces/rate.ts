export interface IRate {
	id?: string;
	userId: string;
	storyId: string;
	star: 1 | 2 | 3 | 4 | 5;
	createdAt?: Date;
	updatedAt?: Date;
}
