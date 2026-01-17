import mongoose from "mongoose";
import { hashPassword } from "../utils/hashPassword.js";

const userAuthSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true,
		},
		username: { type: String },
		email: { type: String, required: true, unique: true },
		password: { type: String },
		providerUserId: { type: String },
		provider: { type: String, default: "local" }, // có thể là local hoaặc google
		lastLoginAt: { type: Date },
	},
	{ timestamps: true },
);

userAuthSchema.pre("save", async function () {
	if (!this.email || this.email?.trim() === "") {
		throw new Error("Email is required");
	}

	this.email = this.email.toLowerCase().trim();

	if (!this.username || this.username?.trim() === "") {
		this.username = this.email.split("@")[0].toLocaleLowerCase();
	}

	if (this.password && this.isModified("password")) {
		this.password = hashPassword(this.password);
	}
});

export const UserAuth = mongoose.model("UserAuth", userAuthSchema);
