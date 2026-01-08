import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export interface IUser {
	_id: string;
	username: string;
	password?: string;
	email: string;
	dob?: Date;
	role: "admin" | "author" | "user";
	status: "active" | "inactive" | "banned";
	avatarURL: string;
	backgroundURL: string;
	vipLevel?: number | 0;
	totalSpent?: number | 0;
	fortuneOints: number;
	createdAt?: Date;
	updatedAt?: Date;
}

const userSchema = new mongoose.Schema(
	{
		username: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		dob: { type: Date },
		role: {
			type: String,
			enum: ["admin", "author", "user"],
			default: "user",
		},
		status: {
			type: String,
			enum: ["active", "inactive", "banned"],
			default: "active",
		},
		avatarURL: { type: String, default: "" },
		backgroundURL: { type: String, default: "" },
		vipLevel: { type: Number, default: 0 },
		totalSpent: { type: Number, default: 0 },
		fortuneOints: { type: Number, default: 0 },
	},
	{ timestamps: true },
);

userSchema.pre("save", async function () {
	if (this.isModified("password")) {
		const salt = bcrypt.genSaltSync(10);
		this.password = bcrypt.hashSync(this.password, salt);
	}
});

export const User = mongoose.model<IUser>("User", userSchema);
