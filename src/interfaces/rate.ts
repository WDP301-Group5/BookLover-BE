import type { Types } from "mongoose";

export interface IRate {
	_id?: Types.ObjectId;
	userId: Types.ObjectId | string;
	storyId: Types.ObjectId | string;
	rate: 1 | 2 | 3 | 4 | 5;
	createdAt?: Date;
	updatedAt?: Date;
}
