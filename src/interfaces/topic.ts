export interface ITopic {
	id: string;
	name: string;
	description: string;
	status: "active" | "inactive";
	createdAt?: Date;
	updatedAt?: Date;
}
