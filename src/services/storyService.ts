import type { IReadingHistory } from "../interfaces/readingHistory";
import { Chapter } from "../models/Chapter";
import { ReadingHistory } from "../models/ReadingHistory";
import { Story } from "../models/Story";
import { StoryView } from "../models/StoryView";

const StoryService = {
	// gợi ý truyện dựa vào lịch sử đọc
	async getRecommendStory(userId?: string | null) {
		try {
			if (userId === null) {
				return this.getTop10Story("m");
			}
			const userHistory = await ReadingHistory.find({ userId: userId })
				.sort({ createdAt: -1 })
				.limit(10)
				.lean<IReadingHistory[]>();
			const readStoryIds = userHistory.map((history) => history.storyId);
			const top5Topics = await Story.aggregate([
				{ $match: { _id: { $in: readStoryIds }, status: "active" } },
				{ $unwind: "$topics" },
				{ $group: { _id: "$topics", count: { $sum: 1 } } },
				{ $sort: { count: -1 } },
				{ $limit: 5 },
			]);
			const topicIds = top5Topics.map((topic) => topic._id);
			const recommendedStories = await Story.aggregate([
				{
					$match: {
						status: "active",
						_id: { $nin: readStoryIds },
						topics: { $in: topicIds },
					},
				},
				{
					$addFields: {
						commonTopicsCount: {
							$size: { $setIntersection: ["$topics", topicIds] },
						},
					},
				},
				{
					$match: { commonTopicsCount: { $gt: 2 } },
				},
				{ $sort: { commonTopicsCount: -1, views: -1, createdAt: -1 } },
				{ $limit: 12 },
				{
					$lookup: {
						from: "users",
						localField: "authorId",
						foreignField: "_id",
						as: "author",
					},
				},
				{ $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
				{
					$lookup: {
						from: "topics",
						localField: "topics",
						foreignField: "_id",
						as: "topics",
					},
				},
				{
					$project: {
						id: "$story.id",
						title: "$story.title",
						slug: "$story.slug",
						image: "$story.image",
						description: "$story.description",
						author: {
							id: "$author._id",
							fullName: "$author.fullName",
							nickName: "$author.nickName",
							penName: "$author.penName",
						},
						topics: "$topics.name",
						tags: "$story.tags",
						status: "$story.status",
						isPremium: "$story.isPremium",
						isFinish: "$story.isFinish",
						views: "$story.views",
						stars: "$story.stars",
						rates: "$story.rates",
						followers: "$story.followers",
						createdAt: "$story.createdAt",
						updatedAt: "$story.updatedAt",
					},
				},
			]);
			return recommendedStories;
		} catch (error) {
			console.log("Error when get recommend story", error);
			throw new Error(`Error fetching recommended stories: ${error}`);
		}
	},

	async getNewChapterStory(offset: number = 0, limit: number = 24) {
		try {
			const stories = await Chapter.aggregate([
				{
					$match: { status: "active" },
				},
				{ $sort: { createdAt: -1 } },
				{
					$group: {
						_id: "$storyId",
						latestChapterAt: { $max: "$createdAt" },
						latestChapterId: { $first: "$_id" },
					},
				},
				{ $sort: { latestChapterAt: -1 } },
				{ $skip: offset },
				{ $limit: limit },
				{
					$lookup: {
						from: "stories",
						localField: "_id",
						foreignField: "_id",
						as: "story",
					},
				},
				{
					$unwind: "$story",
				},
				{
					$match: { "story.status": "active" },
				},
				{
					$lookup: {
						from: "users",
						localField: "story.authorId",
						foreignField: "_id",
						as: "author",
					},
				},
				{
					$unwind: { path: "$author", preserveNullAndEmptyArrays: true },
				},
				{
					$lookup: {
						from: "topics",
						localField: "story.topics",
						foreignField: "_id",
						as: "topics",
					},
				},
				{
					$project: {
						id: "$story.id",
						title: "$story.title",
						slug: "$story.slug",
						image: "$story.image",
						description: "$story.description",
						author: {
							id: "$author._id",
							fullName: "$author.fullName",
							nickName: "$author.nickName",
							penName: "$author.penName",
						},
						topics: "$topics.name",
						tags: "$story.tags",
						status: "$story.status",
						isPremium: "$story.isPremium",
						isFinish: "$story.isFinish",
						views: "$story.views",
						stars: "$story.stars",
						rates: "$story.rates",
						followers: "$story.followers",
						createdAt: "$story.createdAt",
						updatedAt: "$story.updatedAt",
					},
				},
			]);
			const totalStory = await Story.countDocuments({ status: "active" });

			const formatData = stories.map(({ _id, ...rest }) => ({
				id: _id,
				...rest,
			}));
			return { story: formatData, total: totalStory };
		} catch (error) {
			console.log("Error when get new chapter stories:", error);
			throw new Error(`Error fetching new chapter stories: ${error}`);
		}
	},

	async getTop10Story(type: "m" | "w" | "d" = "m") {
		try {
			const now = new Date();
			const range = type === "m" ? 30 : type === "w" ? 7 : 1;
			const endTime = new Date(now.setHours(0, 0, 0, 0));
			const startTime = new Date(
				endTime.setDate(endTime.getTime() - range * 24 * 60 * 60 * 1000),
			);

			const stories = await StoryView.aggregate([
				{
					$match: {
						createdAt: { $gte: startTime, $lt: endTime },
					},
				},
				{
					$group: {
						_id: "$storyId",
						count: { $sum: 1 },
					},
				},
				{ $sort: { count: -1 } },
				{ $limit: 10 },
				{
					$lookup: {
						from: "stories",
						localField: "_id",
						foreignField: "_id",
						as: "story",
					},
				},
				{
					$unwind: "$story",
				},
				{
					$match: { "story.status": "active" },
				},
				{
					$lookup: {
						from: "users",
						localField: "story.authorId",
						foreignField: "_id",
						as: "author",
					},
				},
				{
					$unwind: { path: "$author", preserveNullAndEmptyArrays: true },
				},
				{
					$lookup: {
						from: "topics",
						localField: "story.topics",
						foreignField: "_id",
						as: "topics",
					},
				},
				{
					$lookup: {
						from: "chapters",
						let: { storyId: "$story._id" },
						pipeline: [
							{
								$match: {
									$expr: {
										$and: [
											{ $eq: ["$storyId", "$$storyId"] },
											{ $eq: ["$status", "active"] },
										],
									},
								},
							},
							{ $sort: { createdAt: -1 } },
							{ $limit: 1 },
						],
						as: "chapterNumber",
					},
				},
				{
					$unwind: { path: "$chapterNumber", preserveNullAndEmptyArrays: true },
				},
				{
					$project: {
						id: "$story.id",
						title: "$story.title",
						slug: "$story.slug",
						image: "$story.image",
						description: "$story.description",
						author: {
							id: "$author._id",
							fullName: "$author.fullName",
							nickName: "$author.nickName",
							penName: "$author.penName",
						},
						topics: "$topics.name",
						tags: "$story.tags",
						status: "$story.status",
						isPremium: "$story.isPremium",
						isFinish: "$story.isFinish",
						views: "$story.views",
						stars: "$story.stars",
						rates: "$story.rates",
						chapterNumber: "$chapterNumber.chapterNumber",
						followers: "$story.followers",
						createdAt: "$story.createdAt",
						updatedAt: "$story.updatedAt",
					},
				},
			]);

			// fallback về top 10 lượt xem nếu chưa có data
			if (stories.length === 0) {
				return this.getTop10ViewedStory();
			}

			const formatData = stories.map(({ _id, ...rest }) => ({
				id: _id,
				...rest,
			}));
			return formatData;
		} catch (error) {
			console.log("Error when get top story:", error);
			throw new Error(`Error fetching top 10 stories: ${error}`);
		}
	},

	async getTop10ViewedStory() {
		try {
			const stories = await Chapter.aggregate([
				{
					$match: { status: "active" },
				},
				{
					$group: {
						_id: "$storyId",
						chapterNumber: { $max: "$chapterNumber" },
					},
				},
				{
					$lookup: {
						from: "stories",
						localField: "_id",
						foreignField: "_id",
						as: "story",
					},
				},
				{
					$unwind: "$story",
				},
				{ $match: { "story.status": "active" } },
				{ $sort: { "story.views": -1 } },
				{ $limit: 10 },
				{
					$lookup: {
						from: "topics",
						localField: "story.topics",
						foreignField: "_id",
						as: "topics",
					},
				},
				{
					$lookup: {
						from: "users",
						localField: "story.authorId",
						foreignField: "_id",
						as: "author",
					},
				},
				{
					$unwind: { path: "$author", preserveNullAndEmptyArrays: true },
				},
				{
					$project: {
						id: "$story.id",
						title: "$story.title",
						slug: "$story.slug",
						image: "$story.image",
						description: "$story.description",
						author: {
							id: "$author._id",
							fullName: "$author.fullName",
							nickName: "$author.nickName",
							penName: "$author.penName",
						},
						topics: "$story.topics",
						tags: "$story.tags",
						status: "$story.status",
						isPremium: "$story.isPremium",
						isFinish: "$story.isFinish",
						views: "$story.views",
						stars: "$story.stars",
						rates: "$story.rates",
						chapterNumber: "$chapterNumber",
						followers: "$story.followers",
						createdAt: "$story.createdAt",
						updatedAt: "$story.updatedAt",
					},
				},
			]);
			return stories;
		} catch (error) {
			console.log("Error when get top viewed stories:", error);
			throw new Error(`Error fetching top viewed stories: ${error}`);
		}
	},
};

export default StoryService;
