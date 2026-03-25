import type { IChapter } from "../interfaces/chapter.js";
import { CensorLog } from "../models/CensorLog.js";
import { Chapter } from "../models/Chapter.js";

class AdminChapterCensorService {
	public static async getPendingChapters(): Promise<IChapter[]> {
		return Chapter.find({ status: "pending" })
			.populate({
				path: "storyId",
				select: "title image authorId",
				populate: { path: "authorId", select: "username fullName avatar" },
			})
			.sort({ createdAt: -1 })
			.lean();
	}

	public static async getManagedChapters(): Promise<IChapter[]> {
		return Chapter.find({ status: { $in: ["active", "banned", "rejected"] } })
			.populate({
				path: "storyId",
				select: "title image authorId",
				populate: { path: "authorId", select: "username fullName avatar" },
			})
			.sort({ createdAt: -1 })
			.lean();
	}

	public static async approveChapter(
		chapterId: string,
		adminId: string,
	): Promise<IChapter | null> {
		const chapter = await Chapter.findOneAndUpdate(
			{ _id: chapterId, status: "pending" },
			{ status: "active" },
			{ new: true },
		);

		if (chapter) {
			await CensorLog.create({
				targetType: "Chapter",
				chapterId,
				adminId,
				action: "approve",
			});
		}

		return chapter;
	}

	public static async rejectChapter(
		chapterId: string,
		adminId: string,
		reason: string,
	): Promise<IChapter | null> {
		const chapter = await Chapter.findOneAndUpdate(
			{ _id: chapterId, status: "pending" },
			{ status: "rejected" },
			{ new: true },
		);

		if (chapter) {
			await CensorLog.create({
				targetType: "Chapter",
				chapterId,
				adminId,
				action: "reject",
				reason,
			});
		}

		return chapter;
	}

	public static async banChapter(
		chapterId: string,
		adminId: string,
		reason: string,
	): Promise<IChapter | null> {
		const chapter = await Chapter.findOneAndUpdate(
			{ _id: chapterId, status: "active" },
			{ status: "banned" },
			{ new: true },
		);

		if (chapter) {
			await CensorLog.create({
				targetType: "Chapter",
				chapterId,
				adminId,
				action: "ban",
				reason,
			});
		}

		return chapter;
	}

	public static async unbanChapter(
		chapterId: string,
		adminId: string,
	): Promise<IChapter | null> {
		const chapter = await Chapter.findOneAndUpdate(
			{ _id: chapterId, status: "banned" },
			{ status: "active" },
			{ new: true },
		);

		if (chapter) {
			await CensorLog.create({
				targetType: "Chapter",
				chapterId,
				adminId,
				action: "unban",
			});
		}

		return chapter;
	}

	public static async getChapterCensorLog(chapterId: string) {
		return CensorLog.find({ targetType: "Chapter", chapterId })
			.populate("adminId", "username email avatar fullName")
			.sort({ createdAt: -1 })
			.lean();
	}
}

export default AdminChapterCensorService;
