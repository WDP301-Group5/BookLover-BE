import { ObjectId } from "mongoose";

export interface IMessage {
	_id: string;
	id: string;
	conversationId: string;
	senderId: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Message {
	id: String;
	conversationId: String;
	sender: {
		id: String;
		username: String;
		nickName: String;
		avatarURL: String;
	};
	content: String;
	createdAt: Date;
	updatedAt: Date;
}
