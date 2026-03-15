import mongoose, { Types } from "mongoose";
import { FollowStory } from "../models/FollowStory";
import { Story } from "../models/Story";

const FollowStoryService = {
	async checkUserFollowStory(userId: string, storyId: string) {
		try {
			const followStories = await FollowStory.findOne({ userId, storyId });
			return followStories;
		} catch (error) {
			throw new Error(`Error fetching follow stories: ${error}`);
		}
	},

	async changeStatusFollowStory(
		userId: string,
		storyId: string,
		status: string,
	) {
		try {
			if (!Types.ObjectId.isValid(storyId)) {
				throw new Error("Invalid storyId");
			}

			const story = await Story.findById(storyId);
			if (!story) {
				throw new Error("Story not found");
			}

			const isExist = await FollowStory.exists({ userId, storyId });

			if (!isExist) {
				const newFollowStory = new FollowStory({
					userId,
					storyId,
					status: "follow",
				});
				await newFollowStory.save();
				return newFollowStory;
			}

			const followStory = await FollowStory.findOneAndUpdate(
				{ userId, storyId },
				{ status },
				{ new: true },
			);

			return followStory;
		} catch (error) {
			throw new Error(`Error fetching follow stories: ${error}`);
		}
	},

	async getMyFollowedStories(userId: string) {
		try {
			const followStories = await FollowStory.find({
				userId,
				status: "follow",
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

			return followStories
				.map((item: any) => item.storyId)
				.filter(Boolean);
		} catch (error) {
			throw new Error(`Error fetching my followed stories: ${error}`);
		}
	},
};

export default FollowStoryService;
