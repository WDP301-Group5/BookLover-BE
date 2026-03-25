import { BuyStone } from "../models/BuyStone.js";
import { Chapter } from "../models/Chapter.js";
import { ForumPost } from "../models/ForumPost.js";
import { Story } from "../models/Story.js";
import { StoryView } from "../models/StoryView.js";
import { User } from "../models/User.js";

const TIMEZONE = "Asia/Bangkok";

type GroupBy = "day" | "month" | "year";

function getDateRanges() {
	const now = new Date();

	const startOfToday = new Date(now);
	startOfToday.setHours(0, 0, 0, 0);

	const startOfWeek = new Date(startOfToday);
	const day = startOfWeek.getDay();
	const diff = day === 0 ? 6 : day - 1;
	startOfWeek.setDate(startOfWeek.getDate() - diff);
	startOfWeek.setHours(0, 0, 0, 0);

	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	return {
		now,
		startOfToday,
		startOfWeek,
		startOfMonth,
	};
}

function formatDay(date: Date) {
	const y = date.getFullYear();
	const m = `${date.getMonth() + 1}`.padStart(2, "0");
	const d = `${date.getDate()}`.padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function formatMonth(date: Date) {
	const y = date.getFullYear();
	const m = `${date.getMonth() + 1}`.padStart(2, "0");
	return `${y}-${m}`;
}

function formatYear(date: Date) {
	return `${date.getFullYear()}`;
}

function getGroupFormat(groupBy: GroupBy) {
	switch (groupBy) {
		case "day":
			return "%Y-%m-%d";
		case "month":
			return "%Y-%m";
		case "year":
			return "%Y";
		default:
			return "%Y-%m-%d";
	}
}

function generateLabels(groupBy: GroupBy) {
	const now = new Date();
	const labels: string[] = [];

	if (groupBy === "day") {
		const today = new Date(now);
		today.setHours(0, 0, 0, 0);

		for (let i = 6; i >= 0; i--) {
			const d = new Date(today);
			d.setDate(today.getDate() - i);
			labels.push(formatDay(d));
		}
		return labels;
	}

	if (groupBy === "month") {
		for (let i = 11; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			labels.push(formatMonth(d));
		}
		return labels;
	}

	for (let i = 4; i >= 0; i--) {
		const d = new Date(now.getFullYear() - i, 0, 1);
		labels.push(formatYear(d));
	}
	return labels;
}

function getStartDateForGroup(groupBy: GroupBy) {
	const now = new Date();

	if (groupBy === "day") {
		const start = new Date(now);
		start.setHours(0, 0, 0, 0);
		start.setDate(start.getDate() - 6);
		return start;
	}

	if (groupBy === "month") {
		return new Date(now.getFullYear(), now.getMonth() - 11, 1);
	}

	return new Date(now.getFullYear() - 4, 0, 1);
}

function fillMissingLabels(
	labels: string[],
	data: Array<{ _id: string; count?: number; total?: number }>,
) {
	const map = new Map<string, number>();

	for (const item of data) {
		map.set(item._id, item.count ?? item.total ?? 0);
	}

	return labels.map((label) => ({
		label,
		value: map.get(label) || 0,
	}));
}

async function aggregateChart(
	model: any,
	groupBy: GroupBy,
	sumField?: string,
	matchExtra: Record<string, any> = {},
) {
	const startDate = getStartDateForGroup(groupBy);
	const format = getGroupFormat(groupBy);

	const pipeline: any[] = [
		{
			$match: {
				...matchExtra,
				createdAt: { $gte: startDate },
			},
		},
		{
			$group: {
				_id: {
					$dateToString: {
						format,
						date: "$createdAt",
						timezone: TIMEZONE,
					},
				},
				...(sumField
					? { total: { $sum: `$${sumField}` } }
					: { count: { $sum: 1 } }),
			},
		},
		{ $sort: { _id: 1 } },
	];

	const raw = await model.aggregate(pipeline);
	const labels = generateLabels(groupBy);

	return fillMissingLabels(labels, raw);
}

export const AdminDashboardService = {
	async getOverviewDashboard(groupBy: GroupBy = "day") {
		const { startOfToday, startOfWeek, startOfMonth } = getDateRanges();

		const [
			totalUsers,
			totalAuthors,
			totalStories,
			totalChapters,
			totalForumPosts,
			totalForumComments,
			readToday,
			readWeek,
			readMonth,
			newStoriesToday,
			pendingStories,
			pendingChapters,
			revenueTodayAgg,
			revenueMonthAgg,
			newUsers,
			reads,
			revenue,
			stories,
		] = await Promise.all([
			User.countDocuments(),
			User.countDocuments({ role: "author" }),
			Story.countDocuments(),
			Chapter.countDocuments(),
			ForumPost.countDocuments({
				$or: [{ replyOf: { $exists: false } }, { replyOf: null }],
			}),
			ForumPost.countDocuments({
				replyOf: { $ne: null },
			}),
			StoryView.countDocuments({
				createdAt: { $gte: startOfToday },
			}),
			StoryView.countDocuments({
				createdAt: { $gte: startOfWeek },
			}),
			StoryView.countDocuments({
				createdAt: { $gte: startOfMonth },
			}),
			Story.countDocuments({
				createdAt: { $gte: startOfToday },
			}),
			Story.countDocuments({
				status: "pending",
			}),
			Chapter.countDocuments({
				status: "pending",
			}),
			BuyStone.aggregate([
				{
					$match: {
						status: "success",
						createdAt: { $gte: startOfToday },
					},
				},
				{
					$group: {
						_id: null,
						total: { $sum: "$money" },
					},
				},
			]),
			BuyStone.aggregate([
				{
					$match: {
						status: "success",
						createdAt: { $gte: startOfMonth },
					},
				},
				{
					$group: {
						_id: null,
						total: { $sum: "$money" },
					},
				},
			]),
			aggregateChart(User, groupBy),
			aggregateChart(StoryView, groupBy),
			aggregateChart(BuyStone, groupBy, "money", { status: "success" }),
			aggregateChart(Story, groupBy),
		]);

		const revenueToday = revenueTodayAgg[0]?.total || 0;
		const revenueMonth = revenueMonthAgg[0]?.total || 0;

		return {
			summary: {
				totalUsers,
				totalAuthors,
				totalStories,
				totalChapters,
				totalReviews: 0,
				totalForumPosts,
				totalForumComments,
				readToday,
				readWeek,
				readMonth,
				newStoriesToday,
				pendingStories,
				pendingChapters,
				revenueToday,
				revenueMonth,
			},
			charts: {
				newUsers,
				reads,
				revenue,
				stories,
			},
			filter: {
				groupBy,
			},
		};
	},
};
