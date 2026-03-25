import { Chapter } from "../models/Chapter";
import { Comment } from "../models/Comment";
import { Story } from "../models/Story";
import { User } from "../models/User";

type StoryRankingType = "views" | "followers";
type AuthorRankingType = "followers" | "stories";
type UserRankingType = "comments" | "spent";

const normalizeLimit = (limit?: number, fallback = 10) => {
	const parsed = Number(limit || fallback);
	if (Number.isNaN(parsed) || parsed <= 0) return fallback;
	return Math.min(parsed, 100);
};

const rankingService = {
	async getTopStories({
		type = "views",
		limit = 15,
	}: {
		type?: StoryRankingType;
		limit?: number;
	}) {
		try {
			const finalType: StoryRankingType =
				type === "followers" ? "followers" : "views";
			const finalLimit = normalizeLimit(limit, 15);

			const sortField = finalType === "followers" ? "followers" : "views";

			const stories = await Story.find({
				status: "active",
			})
				.sort({ [sortField]: -1, createdAt: -1 })
				.limit(finalLimit)
				.populate("authorId", "username fullName penName avatarURL")
				.populate("topics", "name")
				.populate("genres", "name")
				.lean();

			const storyIds = stories.map((story: any) => story._id);

			const chapterStats = await Chapter.aggregate([
				{
					$match: {
						storyId: { $in: storyIds },
					},
				},
				{
					$group: {
						_id: "$storyId",
						totalChapters: { $sum: 1 },
					},
				},
			]);

			const chapterCountMap = new Map(
				chapterStats.map((item: any) => [
					item._id.toString(),
					item.totalChapters,
				]),
			);

			const items = stories.map((story: any, index: number) => ({
				rank: index + 1,
				id: story._id?.toString(),
				title: story.title,
				slug: story.slug,
				image: story.image,
				description: story.description,
				authorId: story.authorId?._id?.toString?.() || "",
				author:
					story.authorId?.penName ||
					story.authorId?.fullName ||
					story.authorId?.username ||
					"Ẩn danh",

				topics: Array.isArray(story.topics)
					? story.topics.map((topic: any) => topic?.name).filter(Boolean)
					: [],

				genres: Array.isArray(story.genres)
					? story.genres.map((genre: any) => genre?.name).filter(Boolean)
					: [],

				views: story.views || 0,
				followers: story.followers || 0,
				rates: story.rates || 0,
				stars: story.stars || 0,
				chapters: chapterCountMap.get(story._id.toString()) || 0,
				isPremium: !!story.isPremium,
				isFinish: !!story.isFinish,
				createdAt: story.createdAt,
				updatedAt: story.updatedAt,
			}));

			return {
				type: finalType,
				total: items.length,
				items,
			};
		} catch (error) {
			throw new Error(`Có lỗi xảy ra khi lấy bảng xếp hạng truyện: ${error}`);
		}
	},

	async getTopAuthors({
		type = "followers",
		limit = 30,
	}: {
		type?: AuthorRankingType;
		limit?: number;
	}) {
		try {
			const finalType: AuthorRankingType =
				type === "stories" ? "stories" : "followers";
			const finalLimit = normalizeLimit(limit, 30);

			const sortField =
				finalType === "stories" ? "storiesCount" : "followersCount";

			const authors = await User.find({
				role: "author",
				status: "active",
			})
				.sort({ [sortField]: -1, createdAt: -1 })
				.limit(finalLimit)
				.lean();

			const items = authors.map((author: any, index: number) => ({
				rank: index + 1,
				id: author._id?.toString(),
				penName: author.penName || author.fullName || author.username,
				username: author.username,
				avatarUrl: author.avatarURL || "",
				followersCount: author.followersCount || 0,
				storiesCount: author.storiesCount || 0,
				totalViews: author.totalViews || 0,
				totalVotes: author.totalVotes || 0,
				createdAt: author.createdAt,
				updatedAt: author.updatedAt,
			}));

			return {
				type: finalType,
				total: items.length,
				items,
			};
		} catch (error) {
			throw new Error(`Có lỗi xảy ra khi lấy bảng xếp hạng tác giả: ${error}`);
		}
	},

	async getTopUsers({
		type = "comments",
		limit = 30,
	}: {
		type?: UserRankingType;
		limit?: number;
	}) {
		try {
			const finalType: UserRankingType =
				type === "spent" ? "spent" : "comments";
			const finalLimit = normalizeLimit(limit, 30);

			if (finalType === "spent") {
				const users = await User.find({
					status: "active",
					role: { $in: ["user", "author"] },
				}).lean();

				const items = users
					.map((user: any) => {
						const paidAmount =
							Number(user.spiritStones || 0) + Number(user.totalSpent || 0);

						return {
							id: user._id?.toString(),
							username: user.username,
							fullName: user.fullName,
							avatarUrl: user.avatarURL || "",
							totalComments: 0,
							totalSpent: paidAmount,
							spiritStones: user.spiritStones || 0,
							rawTotalSpent: user.totalSpent || 0,
							vipLevel: user.vipLevel || 0,
							createdAt: user.createdAt,
							updatedAt: user.updatedAt,
						};
					})
					.sort((a, b) => b.totalSpent - a.totalSpent)
					.slice(0, finalLimit)
					.map((user, index) => ({
						rank: index + 1,
						...user,
					}));

				return {
					type: finalType,
					total: items.length,
					items,
				};
			}

			const commentStats = await Comment.aggregate([
				{
					$match: {
						status: "active",
						userId: { $ne: null },
					},
				},
				{
					$group: {
						_id: "$userId",
						totalComments: { $sum: 1 },
					},
				},
				{
					$sort: {
						totalComments: -1,
					},
				},
				{
					$limit: finalLimit,
				},
				{
					$lookup: {
						from: "users",
						localField: "_id",
						foreignField: "_id",
						as: "user",
					},
				},
				{
					$unwind: "$user",
				},
				{
					$match: {
						"user.status": "active",
					},
				},
			]);

			const items = commentStats.map((item: any, index: number) => ({
				rank: index + 1,
				id: item.user?._id?.toString?.() || item._id?.toString?.(),
				username: item.user?.username || "",
				fullName: item.user?.fullName || "",
				avatarUrl: item.user?.avatarURL || "",
				totalComments: item.totalComments || 0,
				totalSpent: 0,
				spiritStones: item.user?.spiritStones || 0,
				rawTotalSpent: item.user?.totalSpent || 0,
				vipLevel: item.user?.vipLevel || 0,
				createdAt: item.user?.createdAt,
				updatedAt: item.user?.updatedAt,
			}));

			return {
				type: finalType,
				total: items.length,
				items,
			};
		} catch (error) {
			throw new Error(
				`Có lỗi xảy ra khi lấy bảng xếp hạng người đọc: ${error}`,
			);
		}
	},
};

export default rankingService;
