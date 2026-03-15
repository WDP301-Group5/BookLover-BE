import mongoose from "mongoose";
import type { IUser } from "../interfaces/user.js";

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
			minlength: 3,
			maxlength: 20,
			match: [
				/^[a-z0-9_]+$/,
				"Username chỉ được chứa chữ thường, số và dấu _",
			],
		},
		fullName: { type: String, required: true },
		nickName: { type: String },
		penName: { type: String },
		email: { type: String, required: true, unique: true },
		dob: { type: Date },
		bio: { type: String, maxlength: 500 },
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

		// ===== STATS (PROFILE PUBLIC) =====
		followersCount: { type: Number, default: 0, min: [0, "followersCount không được âm"] },
		followingCount: { type: Number, default: 0, min: [0, "followingCount không được âm"] },
		followingStoriesCount: { type: Number, default: 0 },
		storiesCount: { type: Number, default: 0, min: [0, "storiesCount không được âm"] },

		totalViews: { type: Number, default: 0 }, // author
		totalVotes: { type: Number, default: 0 }, // author

		// ===== INTERNAL SYSTEM =====
		totalSpent: { type: Number, default: 0 },
		spiritStones: { type: Number, default: 0 },
		online: { type: String, default: new Date().getTime().toString() },
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
