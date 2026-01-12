export interface IUser {
	id: string;
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
	fortunePoints: number | 0;
	createdAt?: Date;
	updatedAt?: Date;
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
