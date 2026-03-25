export interface IForumCategory {
	id: string;
	forumId: string;
	author: string;
	type: "story" | "sideline" | "question";
	storyId?: string;
	title: string;
	slug: string;
	description: string;
	status: "active" | "inactive";
	view: number;
	post: number;
	createdAt?: Date;
	updatedAt?: Date;
}
