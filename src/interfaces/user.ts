import type mongoose from "mongoose";
export interface IUser {
	id: string;
	username: string;
	fullName: string;
	nickName?: string;
	penName?: string;
	email: string;
	dob?: Date;
	role: "admin" | "author" | "user";
	status: "active" | "inactive" | "banned";
	avatarURL?: string;
	backgroundURL?: string;
	vipLevel?: number | 0;
	totalSpent?: number | 0;
	spiritStones: number | 0;
	online: string | "online";
	createdAt?: Date;
	updatedAt?: Date;
	followersCount?: number;
	followingCount?: number;
	followingStoriesCount?: number;
	storiesCount?: number;
	banReason?: string;
	bannedAt?: Date | null;
	bannedBy?: mongoose.Types.ObjectId | null;
}

export interface UserProfile {
	id: string;
	username: string;
	email: string;
	role: string;
	status: string;
	avatarURL: string;
	backgroundURL: string;
	vipLevel: number;
	fortunePoints: number;
	createdAt?: Date;
	updatedAt?: Date;
}
export interface IUpdateUserData {
	fullName: string;
	nickName: string;
	username: string;
	penName: string;
	dob: string;
	avatarURL: string;
	backgroundURL: string;
	bio: string;
}

export interface IUserPreview {
	_id: string;
	id: string;
	online: string;
	username: string;
	fullName: string;
	avatarURL: string;
}
