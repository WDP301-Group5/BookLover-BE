export interface IReadingList {
	_id?: string;
	id?: string;
	userId: string;
	name: string;
	stories: string[]; // Array of story IDs
	createdAt?: Date;
	updatedAt?: Date;
}

export interface IReadingListWithStories extends IReadingList {
	stories: any[];
}
