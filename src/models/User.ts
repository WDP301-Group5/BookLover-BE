import mongoose from "mongoose";
import type { IUser } from "../interfaces/user.js";

const userSchema = new mongoose.Schema(
	{
		fullName: { type: String, required: true },
		nickName: { type: String },
		penName: { type: String },
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
	if (!this.nickName || this.nickName?.trim() === "") {
		this.nickName = this.fullName;
	}
	if (!this.penName || this.penName?.trim() === "") {
		this.penName = this.fullName;
	}
});

export const User = mongoose.model<IUser>("User", userSchema);
