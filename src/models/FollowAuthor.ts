import mongoose from "mongoose";
import type { IFollowAuthor } from "../interfaces/followAuthor";

type FollowAuthorDocument = mongoose.HydratedDocument<IFollowAuthor>;

const followAuthorSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		authorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		status: {
			type: String,
			enum: ["follow", "unsend", "unfollow"],
			default: "follow",
		},
	},
	{ timestamps: true },
);

// Mỗi cặp follower -> target chỉ có 1 record
followAuthorSchema.index({ userId: 1, authorId: 1 }, { unique: true });

// Query followers/following sẽ nhanh hơn
followAuthorSchema.index({ authorId: 1, status: 1, createdAt: -1 });
followAuthorSchema.index({ userId: 1, status: 1, createdAt: -1 });

// Chặn follow chính mình ở tầng schema
followAuthorSchema.pre("validate", function (this: FollowAuthorDocument) {
	if (this.userId?.toString() === this.authorId?.toString()) {
		throw new Error("Cannot follow yourself");
	}
});

export const FollowAuthor = mongoose.model<IFollowAuthor>(
	"FollowAuthor",
	followAuthorSchema,
);
