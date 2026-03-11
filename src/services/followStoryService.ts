import { FollowStory } from "../models/FollowStory";

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
				{ status: status },
				{ new: true },
			);
			return followStory;
		} catch (error) {
			throw new Error(`Error fetching follow stories: ${error}`);
		}
	},
};

export default FollowStoryService;
