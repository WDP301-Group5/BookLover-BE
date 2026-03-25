import { Types } from "mongoose";
import { FollowStory } from "../models/FollowStory";
import { Story } from "../models/Story";

const FollowStoryService = {
	async checkUserFollowStory(userId: string, storyId: string) {
		try {
			const followStory = await FollowStory.findOne({ userId, storyId });
			return followStory;
		} catch (error) {
			throw new Error(`Error fetching follow story: ${error}`);
		}
	},

	async changeStatusFollowStory(
		userId: string,
		storyId: string,
		status: "follow" | "unfollow" | "unsend",
	) {
		try {
			if (!Types.ObjectId.isValid(storyId)) {
				throw new Error("Invalid storyId");
			}

			if (!["follow", "unfollow", "unsend"].includes(status)) {
				throw new Error("Invalid follow status");
			}

			const story = await Story.findById(storyId);
			if (!story) {
				throw new Error("Story not found");
			}

			const existing = await FollowStory.findOne({ userId, storyId });

			if (!existing) {
				const newFollowStory = new FollowStory({
					userId,
					storyId,
					status,
				});
				await newFollowStory.save();
				return newFollowStory;
			}

			existing.status = status;
			await existing.save();
			return existing;
		} catch (error) {
			throw new Error(`Error changing follow story status: ${error}`);
		}
	},

	async getMyFollowedStories(userId: string) {
		try {
			const followStories = await FollowStory.find({
				userId,
				status: { $in: ["follow", "unsend"] },
			}).populate({
				path: "storyId",
				populate: [
					{
						path: "authorId",
						select: "fullName nickName penName avatarURL",
					},
					{
						path: "topics",
						select: "name description status",
					},
					{
						path: "genres",
						select: "name description status",
					},
				],
			});

			return followStories.map((item: any) => item.storyId).filter(Boolean);
		} catch (error) {
			throw new Error(`Error fetching my followed stories: ${error}`);
		}
	},
};

export default FollowStoryService;
