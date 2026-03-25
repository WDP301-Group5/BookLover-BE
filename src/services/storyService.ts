// src/services/storyService.ts
import type { IReadingHistory } from "../interfaces/readingHistory";
import type { IStory } from "../interfaces/story";
import { Chapter } from "../models/Chapter";
import { Comment } from "../models/Comment";
import { Rate } from "../models/Rate";
import { ReadingHistory } from "../models/ReadingHistory";
import { Story } from "../models/Story";
import { StoryView } from "../models/StoryView";
import { User } from "../models/User";
import { slugify } from "../utils/validation";
import * as chapterService from "./chapterService";

const escapeRegExp = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildUniqueStorySlug = async (title: string): Promise<string> => {
	const baseSlug = slugify(title || "") || `story-${Date.now()}`;
	const slugPattern = new RegExp(
		`^${escapeRegExp(baseSlug)}(?:-(\\d+))?$`,
		"i",
	);

	const existedSlugs = await Story.find({ slug: slugPattern })
		.select("slug -_id")
		.lean();

	if (existedSlugs.length === 0) {
		return baseSlug;
	}

	const normalizedSlugs = new Set(
		existedSlugs
			.map((item) => item.slug)
			.filter((item): item is string => typeof item === "string")
			.map((item) => item.toLowerCase()),
	);

	if (!normalizedSlugs.has(baseSlug.toLowerCase())) {
		return baseSlug;
	}

	let maxSuffix = 1;
	for (const existedSlug of normalizedSlugs) {
		const match = existedSlug.match(
			new RegExp(`^${escapeRegExp(baseSlug.toLowerCase())}-(\\d+)$`),
		);
		if (!match) continue;

		const suffix = Number(match[1]);
		if (!Number.isNaN(suffix)) {
			maxSuffix = Math.max(maxSuffix, suffix);
		}
	}

	return `${baseSlug}-${maxSuffix + 1}`;
};

import mongoose from "mongoose";

type FilterOptions = {
	offset: number;
	limit: number;
	status?: string;
	category?: string;
	search?: string;
	sortBy?: string;
};
const StoryService = {
	// gợi ý truyện dựa vào lịch sử đọc
	async getRecommendStory(userId?: string | null) {
		try {
			if (userId === null) {
				console.log("====================null");
				return await this.getTop10Story("m");
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
				{ $limit: 10 },
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
					$match: { commonTopicsCount: { $gte: 1 } },
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
						id: "$_id",
						title: "$title",
						slug: "$slug",
						image: "$image",
						description: "$description",
						author: {
							id: "$author._id",
							fullName: "$author.fullName",
							nickName: "$author.nickName",
							penName: "$author.penName",
						},
						topics: "$topics.name",
						tags: "$tags",
						status: "$status",
						isPremium: "$isPremium",
						isFinish: "$isFinish",
						views: "$views",
						stars: "$stars",
						rates: "$rates",
						followers: "$followers",
						createdAt: "$createdAt",
						updatedAt: "$updatedAt",
					},
				},
			]);
			if (recommendedStories?.length < 10) {
				const top10Story = await this.getTop10Story("m");
				const idnotIn = recommendedStories?.map((s) => s.id);
				const filter = top10Story.filter((s) => !idnotIn.includes(s.id));
				if (
					filter.length > 0 &&
					recommendedStories.length + filter.length >= 10
				) {
					return [...recommendedStories, ...filter];
				} else {
					const topViewStory = await this.getTop10ViewedStory();
					const filterView = topViewStory.filter(
						(s) => !idnotIn.includes(s.id),
					);
					if (
						filterView.length > 0 &&
						recommendedStories.length + filterView.length >= 10
					) {
						return [...recommendedStories, ...filterView];
					}
					return [...recommendedStories, ...top10Story];
				}
			}
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
					$unwind: { path: "$story", preserveNullAndEmptyArrays: true },
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
						id: "$story._id",
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
			const totalStoryAgg = await Chapter.aggregate([
				{
					$match: { status: "active" },
				},
				{
					$group: {
						_id: "$storyId",
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
				{
					$match: {
						"story.status": "active",
					},
				},
				{
					$count: "total",
				},
			]);

			const totalStory = totalStoryAgg[0]?.total || 0;

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
			const endTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
			const startTime = new Date(
				endTime.getTime() - range * 24 * 60 * 60 * 1000,
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
						id: "$story._id",
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
				return await this.getTop10ViewedStory();
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
						id: "$story._id",
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

	async createStory(data: IStory) {
		try {
			const slug = await buildUniqueStorySlug(data.title);
			const story = await Story.create({ ...data, slug });

			// Grant "author" role to user if they don't have it yet (first story)
			if (data.authorId) {
				const user = await User.findById(data.authorId).select("role");
				if (user && user.role === "user") {
					await User.findByIdAndUpdate(data.authorId, { role: "author" });
				}
			}

			return {
				...story.toObject(),
				id: story._id.toString(),
			};
		} catch (error) {
			throw new Error(`Error creating story: ${error}`);
		}
	},

	async getStoryBySlug(slug: string, userId?: string) {
		try {
			// Use exact slug matching to ensure we get the correct story when there are duplicates
			// Slugs are generated as "base-slug" or "base-slug-N" for uniqueness
			const story = await Story.findOne({ slug: { $eq: slug } })
				.populate("topics")
				.populate("authorId", "fullName nickName penName avatarURL username")
				.lean();

			if (!story) {
				throw new Error("Story not found");
			}

			// Check if story is accessible: must be "active" or user is the author
			if (story.status !== "active") {
				const storyAuthorId = (story.authorId as any)?._id?.toString();
				if (!userId || storyAuthorId !== userId) {
					throw new Error("Story not found"); // Treat as not found for non-authors
				}
			}

			const author = story.authorId as any;

			return {
				...story,
				id: story._id.toString(),
				author: author
					? {
							id: author._id?.toString(),
							fullName: author.fullName,
							nickName: author.nickName,
							penName: author.penName,
							username: author.username,
							avatarURL: author.avatarURL,
						}
					: null,
			};
		} catch (error) {
			throw new Error(`Error fetching story by slug: ${error}`);
		}
	},

	async getStoryIdBySlug(slug: string) {
		try {
			// Use exact slug matching to ensure we get the correct story when there are duplicates
			const story = await Story.findOne({ slug: { $eq: slug } })
				.select("_id")
				.lean();
			if (!story) {
				throw new Error("Story not found");
			}
			return story._id.toString();
		} catch (error) {
			throw new Error(`Error fetching story by slug: ${error}`);
		}
	},

	async getStoryMetaBySlug(slug: string) {
		try {
			// Use exact slug matching to ensure we get the correct story when there are duplicates
			const story = await Story.findOne({ slug: { $eq: slug } })
				.select("_id authorId status")
				.lean();
			if (!story) {
				throw new Error("Story not found");
			}
			return {
				id: story._id.toString(),
				authorId: story.authorId.toString(),
				status: story.status,
			};
		} catch (error) {
			throw new Error(`Error fetching story by slug: ${error}`);
		}
	},

	async getStories() {
		try {
			const stories = await Story.find({ status: "active" });
			return stories;
		} catch (error) {
			throw new Error(`Error fetching stories: ${error}`);
		}
	},

	async updateStory(id: string, data: Partial<IStory>) {
		try {
			// If status is being changed to "private", cascade chapters to "private" as well
			if (data.status === "private") {
				await chapterService.updateChapterStatusByStory(
					id,
					["draft", "pending", "active"],
					"private",
				);
			}

			const story = await Story.findByIdAndUpdate(id, data, { new: true });
			return story;
		} catch (error) {
			throw new Error(`Error updating story: ${error}`);
		}
	},

	async deleteStory(id: string) {
		try {
			// Delete all chapters belong to this story
			await Chapter.deleteMany({ storyId: id });
			// Delete the story
			await Story.findByIdAndDelete(id);
			return { message: "Story deleted successfully" };
		} catch (error) {
			throw new Error(`Error deleting story: ${error}`);
		}
	},

	async unpublishStory(id: string) {
		try {
			// Change story status to "private"
			const story = await Story.findByIdAndUpdate(
				id,
				{ status: "private" },
				{ new: true },
			);

			if (story) {
				// Cascade: set all chapters to "private"
				await chapterService.updateChapterStatusByStory(
					id,
					["draft", "pending", "active"],
					"private",
				);
			}

			return story;
		} catch (error) {
			throw new Error(`Error unpublishing story: ${error}`);
		}
	},

	async getStoriesByAuthor(
		authorId: string,
		offset: number = 0,
		limit: number = 10,
	) {
		try {
			const stories = await Story.find({ authorId })
				.populate("topics")
				.sort({ createdAt: -1 })
				.skip(offset)
				.limit(limit)
				.lean();

			const total = await Story.countDocuments({ authorId });

			return {
				stories,
				total,
				offset,
				limit,
			};
		} catch (error) {
			throw new Error(`Error fetching stories by author: ${error}`);
		}
	},

	async viewStory(id: string) {
		try {
			await Story.findByIdAndUpdate(id, { $inc: { views: 1 } });
			return { message: "Story viewed successfully" };
		} catch (error) {
			throw new Error(`Error viewing story: ${error}`);
		}
	},

	async getNewChapterStoryWithFilter(opts: FilterOptions) {
		const { offset, limit, status, category, search, sortBy } = opts;

		try {
			const matchStage: any = { status: "active" }; // mặc định active

			// map status front-end sang field back-end
			if (status) {
				if (status === "Hoàn thành") matchStage.isFinish = true;
				else if (status === "Đang tiến hành") matchStage.isFinish = false;
			}

			if (search) matchStage.title = { $regex: search, $options: "i" };

			const pipeline: any[] = [{ $match: matchStage }];

			// filter category
			// pipeline filter category
			if (category && category !== "all") {
				pipeline.push(
					// lookup topics
					{
						$lookup: {
							from: "topics",
							localField: "topics", // ✅ field trong Story
							foreignField: "_id",
							as: "topicDocs",
						},
					},
					// lookup genres
					{
						$lookup: {
							from: "genres",
							localField: "genres",
							foreignField: "_id",
							as: "genreDocs",
						},
					},
					{
						$match: {
							$or: [
								{ "topicDocs._id": new mongoose.Types.ObjectId(category) },
								{ "genreDocs._id": new mongoose.Types.ObjectId(category) },
							],
						},
					},
				);
			}

			// sort
			let sortStage: any = {};
			const now = new Date();

			switch (sortBy) {
				case "Ngày cập nhật":
					sortStage = { updatedAt: -1 };
					break;
				case "Truyện mới":
					sortStage = { createdAt: -1 };
					break;
				case "Top tháng":
				case "Top tuần":
				case "Top ngày": {
					let days =
						sortBy === "Top tháng" ? 30 : sortBy === "Top tuần" ? 7 : 1;
					const startTime = new Date(
						now.getTime() - days * 24 * 60 * 60 * 1000,
					);
					pipeline.unshift(
						{
							$lookup: {
								from: "storyviews",
								localField: "_id",
								foreignField: "storyId",
								as: "viewsDocs",
							},
						},
						{
							$addFields: {
								recentViews: {
									$size: {
										$filter: {
											input: "$viewsDocs",
											cond: { $gte: ["$$this.createdAt", startTime] },
										},
									},
								},
							},
						},
					);
					sortStage = { recentViews: -1 };
					break;
				}
				case "Top theo dõi":
					sortStage = { followers: -1 };
					break;
				case "Số chapter":
					pipeline.push(
						{
							$lookup: {
								from: "chapters",
								localField: "_id",
								foreignField: "storyId",
								as: "chapterDocs",
							},
						},
						{
							$addFields: { chapterNumber: { $size: "$chapterDocs" } },
						},
					);
					sortStage = { chapterNumber: -1 };
					break;
				case "Bình luận":
					pipeline.push(
						{
							$lookup: {
								from: "comments",
								localField: "_id",
								foreignField: "storyId",
								as: "commentDocs",
							},
						},
						{
							$addFields: { commentCount: { $size: "$commentDocs" } },
						},
					);
					sortStage = { commentCount: -1 };
					break;
				default:
					sortStage = { updatedAt: -1 };
			}

			pipeline.push({ $sort: sortStage });

			// pagination
			pipeline.push({ $skip: offset }, { $limit: limit });

			// join author & topics
			pipeline.push(
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
						from: "genres",
						localField: "genres",
						foreignField: "_id",
						as: "genres",
					},
				},
				{
					$lookup: {
						from: "topics",
						localField: "topics",
						foreignField: "_id",
						as: "topics",
					},
				},
				{
					$lookup: {
						from: "chapters", // collection muốn join
						let: { storyId: "$_id" }, // biến local để dùng trong pipeline
						pipeline: [
							{
								$match: {
									$expr: { $eq: ["$storyId", "$$storyId"] }, // chỉ lấy chapter của story này
								},
							},
						],
						as: "chapters", // mảng chapter
					},
				},
				{
					$addFields: {
						chapters: { $size: { $ifNull: ["$chapters", []] } },
					},
				},
				{
					$project: {
						id: "$_id",
						title: 1,
						slug: 1,
						image: 1,
						description: 1,
						author: {
							id: "$author._id",
							fullName: "$author.fullName",
							nickName: "$author.nickName",
							penName: "$author.penName",
						},
						topics: "$topics.name",
						genres: "$genres.name",
						tags: 1,
						status: 1,
						isPremium: 1,
						isFinish: 1,
						views: 1,
						stars: 1,
						rates: 1,
						chapters: "$chapters",
						followers: 1,
						createdAt: 1,
						updatedAt: 1,
					},
				},
			);

			const stories = await Story.aggregate(pipeline);

			// total
			const countFilter: any = { status: "active" };
			if (status) {
				if (status === "Hoàn thành") countFilter.isFinish = true;
				else if (status === "Đang tiến hành") countFilter.isFinish = false;
			}
			if (search) countFilter.title = { $regex: search, $options: "i" };

			let total = await Story.countDocuments(countFilter);

			if (category && category !== "all" && category !== "Tất cả") {
				const genres = await Story.aggregate([
					{ $match: countFilter },
					{
						$lookup: {
							from: "genres",
							localField: "topics",
							foreignField: "_id",
							as: "genreDocs",
						},
					},
					{ $match: { "genreDocs.name": category } },
				]);
				total = genres.length;
			}

			return { story: stories, total };
		} catch (error) {
			console.error("Error fetching stories with filter:", error);
			throw new Error(`Error fetching stories: ${error}`);
		}
	},

	async getStoryWithAuthor(slug: string, userId?: string): Promise<IStory> {
		try {
			// Use exact slug matching to ensure we get the correct story when there are duplicates
			const story = await Story.findOne({ slug: { $eq: slug } })
				.populate({ path: "authorId", select: "penName fullName" })
				.populate("topics")
				.lean<IStory>();
			if (!story) throw new Error("Story not found");

			// Check if story is accessible: must be "active" or user is the author
			if (story.status !== "active") {
				const storyAuthorId = (story.authorId as any)?._id?.toString();
				if (!userId || storyAuthorId !== userId) {
					throw new Error("Story not found"); // Treat as not found for non-authors
				}
			}

			story.topics = story.topics.map((t: any) => t.name || "");
			return story;
		} catch (error) {
			throw error;
		}
	},

	async rateStory(userId: string, storyId: string, rate: number) {
		try {
			if (!mongoose.Types.ObjectId.isValid(storyId)) {
				throw new Error("Invalid storyId");
			}

			if (![1, 2, 3, 4, 5].includes(rate)) {
				throw new Error("Số sao phải từ 1 đến 5");
			}

			const normalizedRate = rate as 1 | 2 | 3 | 4 | 5;

			const story = await Story.findById(storyId);
			if (!story) {
				throw new Error("Không tìm thấy truyện");
			}

			const existingRate = await Rate.findOne({ userId, storyId });

			if (!existingRate) {
				await Rate.create({
					userId,
					storyId,
					rate: normalizedRate,
				});

				story.stars += normalizedRate;
				story.rates += 1;
			} else {
				const oldRate = existingRate.rate;
				const diff = normalizedRate - oldRate;

				existingRate.rate = normalizedRate;
				await existingRate.save();

				story.stars += diff;
			}

			await story.save();

			return {
				message: "Đánh giá truyện thành công",
				storyId: story._id,
				stars: story.stars,
				rates: story.rates,
				averageRating:
					story.rates > 0 ? Number((story.stars / story.rates).toFixed(1)) : 0,
			};
		} catch (error) {
			throw error;
		}
	},
};

export default StoryService;
