export interface IGenre {
	id: string;
	name: string;
	description?: string;
	avatar?: string;
	status: "active" | "inactive";
	createdAt?: Date;
	updatedAt?: Date;
}
