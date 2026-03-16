import redisClient from "../config/redis.js";
import { DOTENV } from "../consts/dotenv.js";
import { Chapter } from "../models/Chapter.js";
import AIAnalysisService from "./aiAnalysisService.js";
import BannedKeywordService from "./bannedKeywordService.js";
import HardFilterService from "./hardFilterService.js";
import notificationService from "./notificationService.js";

const MODERATION_QUEUE_KEY = "moderation:queue:chapters";
const MODERATION_PROCESSING_KEY = "moderation:processing";
const MODERATION_FAILED_KEY = "moderation:failed";

class ModerationQueueService {
	private static isProcessing = false;

	static async addChapter(chapterId: string): Promise<void> {
		await redisClient.lPush(MODERATION_QUEUE_KEY, chapterId);
		console.log(`Chapter ${chapterId} added to moderation queue`);
	}

	static async processQueue(): Promise<void> {
		if (this.isProcessing || !DOTENV.AI_MODERATION_ENABLED) {
			return;
		}

		this.isProcessing = true;

		try {
			while (true) {
				const chapterId = await redisClient.rPop(MODERATION_QUEUE_KEY);
				if (!chapterId) break;

				await redisClient.lPush(MODERATION_PROCESSING_KEY, chapterId);

				try {
					await this.processChapter(chapterId);
				} catch (error) {
					console.error(`Error processing chapter ${chapterId}:`, error);
					await redisClient.lRem(MODERATION_PROCESSING_KEY, 1, chapterId);
					await redisClient.lPush(MODERATION_FAILED_KEY, chapterId);
					continue;
				}

				await redisClient.lRem(MODERATION_PROCESSING_KEY, 1, chapterId);
			}
		} finally {
			this.isProcessing = false;
		}
	}

	private static async processChapter(chapterId: string): Promise<void> {
		console.log(`Processing moderation for chapter: ${chapterId}`);

		const chapter = await Chapter.findById(chapterId);
		if (!chapter) {
			console.error(`Chapter not found: ${chapterId}`);
			return;
		}

		try {
			const content = await this.fetchChapterContent(chapter.contentURL);

			const keywords = await BannedKeywordService.getAllKeywords();
			const filterResult = HardFilterService.checkContent(content, keywords);

			if (filterResult.blocked) {
				await Chapter.findByIdAndUpdate(chapterId, { status: "rejected" });
				await AIAnalysisService.analyze(chapterId, content).catch(() => {});
				await notificationService.createNotification({
					to: chapter.storyId.toString(),
					type: "chapter_rejected",
					title: "Chương bị từ chối",
					content: `Chương "${chapter.title}" đã bị từ chối do chứa từ khóa cấm`,
				});
				console.log(`Chapter ${chapterId} blocked by hard filter`);
				return;
			}

			const { decision } = await AIAnalysisService.analyze(chapterId, content);

			if (decision === "auto-approved") {
				await Chapter.findByIdAndUpdate(chapterId, { status: "active" });
				await notificationService.createNotification({
					to: chapter.storyId.toString(),
					type: "chapter_approved",
					title: "Chương được duyệt",
					content: `Chương "${chapter.title}" đã được duyệt tự động`,
				});
				console.log(`Chapter ${chapterId} auto-approved`);
			} else if (decision === "auto-rejected") {
				await Chapter.findByIdAndUpdate(chapterId, { status: "rejected" });
				await notificationService.createNotification({
					to: chapter.storyId.toString(),
					type: "chapter_rejected",
					title: "Chương bị từ chối",
					content: `Chương "${chapter.title}" đã bị từ chối do vi phạm quy định sàn`,
				});
				console.log(`Chapter ${chapterId} auto-rejected`);
			} else {
				console.log(`Chapter ${chapterId} flagged for review`);
			}
		} catch (error) {
			console.error(`Error in processChapter for ${chapterId}:`, error);
			throw error;
		}
	}

	static async fetchChapterContentDirectly(contentURL: string): Promise<string> {
		try {
			const axios = (await import("axios")).default;
			const response = await axios.get(contentURL, { timeout: 30000 });
			return typeof response.data === "string"
				? response.data
				: JSON.stringify(response.data);
		} catch (error) {
			console.error("Error fetching chapter content:", error);
			return "";
		}
	}

	private static async fetchChapterContent(
		contentURL: string,
	): Promise<string> {
		try {
			const axios = (await import("axios")).default;
			const response = await axios.get(contentURL, { timeout: 10000 });
			return typeof response.data === "string"
				? response.data
				: JSON.stringify(response.data);
		} catch {
			return "";
		}
	}

	static async getQueueStatus(): Promise<{
		pending: number;
		processing: number;
		failed: number;
	}> {
		const [pending, processing, failed] = await Promise.all([
			redisClient.lLen(MODERATION_QUEUE_KEY),
			redisClient.lLen(MODERATION_PROCESSING_KEY),
			redisClient.lLen(MODERATION_FAILED_KEY),
		]);

		return { pending, processing, failed };
	}

	static async retryFailed(): Promise<number> {
		const failed = await redisClient.lRange(MODERATION_FAILED_KEY, 0, -1);
		if (failed.length === 0) return 0;

		await redisClient.del(MODERATION_FAILED_KEY);

		for (const chapterId of failed) {
			await this.addChapter(chapterId);
		}

		return failed.length;
	}
}

setInterval(() => {
	ModerationQueueService.processQueue().catch(console.error);
}, 5000);

export default ModerationQueueService;
