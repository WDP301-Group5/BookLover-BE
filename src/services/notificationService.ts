import { FollowAuthor } from "../models/FollowAuthor";
import { FollowStory } from "../models/FollowStory";
import { Notification } from "../models/Notification";

type NotificationPayload = {
	from?: string | null;
	to: string;
	type:
		| "user_followed_you"
		| "story_approved"
		| "new_story_from_followed_author"
		| "chapter_approved"
		| "chapter_rejected"
		| "new_chapter_from_followed_story"
		| "forum_post_commented"
		| "forum_post_reacted";
	title: string;
	content: string;
	data?: Record<string, any>;
};

class NotificationService {
	async createNotification(payload: NotificationPayload) {
		return await Notification.create({
			from: payload.from ?? null,
			to: payload.to,
			type: payload.type,
			title: payload.title,
			content: payload.content,
			data: payload.data || {},
		});
	}

	async createManyNotifications(payloads: NotificationPayload[]) {
		if (!payloads.length) return [];
		return await Notification.insertMany(
			payloads.map((item) => ({
				from: item.from ?? null,
				to: item.to,
				type: item.type,
				title: item.title,
				content: item.content,
				data: item.data || {},
			})),
		);
	}

	async getMyNotifications(params: {
		userId: string;
		page?: number;
		limit?: number;
		status?: "read" | "unread";
	}) {
		const page = Number(params.page || 1);
		const limit = Number(params.limit || 10);
		const skip = (page - 1) * limit;

		const filter: Record<string, any> = {
			to: params.userId,
		};

		if (params.status) {
			filter.status = params.status;
		}

		const [items, total, unreadCount] = await Promise.all([
			Notification.find(filter)
				.populate("from", "username fullName avatarURL")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Notification.countDocuments(filter),
			Notification.countDocuments({
				to: params.userId,
				status: "unread",
			}),
		]);

		return {
			items,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
			unreadCount,
		};
	}

	async getUnreadCount(userId: string) {
		const unreadCount = await Notification.countDocuments({
			to: userId,
			status: "unread",
		});

		return { unreadCount };
	}

	async markAsRead(notificationId: string, userId: string) {
		const notification = await Notification.findOneAndUpdate(
			{
				_id: notificationId,
				to: userId,
			},
			{
				$set: { status: "read" },
			},
			{ new: true },
		);

		if (!notification) {
			throw new Error("Notification not found");
		}

		return notification;
	}

	async markAllAsRead(userId: string) {
		await Notification.updateMany(
			{
				to: userId,
				status: "unread",
			},
			{
				$set: { status: "read" },
			},
		);

		return { message: "Marked all notifications as read" };
	}

	async deleteNotification(notificationId: string, userId: string) {
		const deleted = await Notification.findOneAndDelete({
			_id: notificationId,
			to: userId,
		});

		if (!deleted) {
			throw new Error("Notification not found");
		}

		return { message: "Deleted notification successfully" };
	}

	// =======================================
	// BUSINESS NOTIFICATION TRIGGERS
	// =======================================

	// 1) Có người follow mình
	// Dùng bảng Follow
	async notifyUserFollowed(params: {
		followerId: string;
		followingId: string;
		followerUsername: string;
	}) {
		const { followerId, followingId, followerUsername } = params;

		if (followerId === followingId) return null;

		return await this.createNotification({
			from: followerId,
			to: followingId,
			type: "user_followed_you",
			title: "Bạn có người theo dõi mới",
			content: `${followerUsername} vừa theo dõi bạn.`,
			data: {
				followerId,
				followerUsername,
			},
		});
	}

	// 2) Admin duyệt truyện
	// - notify cho tác giả
	// - notify cho user follow author đó
	// Dùng bảng FollowAuthor
	async notifyStoryApproved(params: {
		storyId: string;
		storyTitle: string;
		storySlug?: string;
		authorId: string;
		adminId?: string | null;
	}) {
		const { storyId, storyTitle, storySlug, authorId, adminId } = params;

		const notifications: NotificationPayload[] = [];

		// notify cho author
		notifications.push({
			from: adminId ?? null,
			to: authorId,
			type: "story_approved",
			title: "Truyện đã được duyệt",
			content: `Truyện "${storyTitle}" của bạn đã được admin duyệt.`,
			data: {
				storyId,
				storySlug,
			},
		});

		// notify cho user follow author
		const followers = await FollowAuthor.find({
			authorId,
			status: "follow",
		})
			.select("userId")
			.lean();

		for (const item of followers) {
			notifications.push({
				from: authorId,
				to: item.userId.toString(),
				type: "new_story_from_followed_author",
				title: "Tác giả bạn theo dõi vừa có truyện mới",
				content: `Tác giả bạn theo dõi vừa có truyện mới: "${storyTitle}".`,
				data: {
					storyId,
					storySlug,
					authorId,
				},
			});
		}

		return await this.createManyNotifications(notifications);
	}

	// 3) Admin duyệt chapter mới
	// - notify cho author
	// - notify cho user follow story đó
	// Dùng bảng FollowStory
	async notifyChapterApproved(params: {
		chapterId: string;
		chapterTitle: string;
		chapterNumber?: number;
		storyId: string;
		storyTitle: string;
		storySlug?: string;
		authorId: string;
		adminId?: string | null;
	}) {
		const {
			chapterId,
			chapterTitle,
			chapterNumber,
			storyId,
			storyTitle,
			storySlug,
			authorId,
			adminId,
		} = params;

		const notifications: NotificationPayload[] = [];

		// notify author
		notifications.push({
			from: adminId ?? null,
			to: authorId,
			type: "chapter_approved",
			title: "Chương mới đã được duyệt",
			content: `Chương "${chapterTitle}" của truyện "${storyTitle}" đã được admin duyệt.`,
			data: {
				chapterId,
				storyId,
				storySlug,
				chapterNumber,
			},
		});

		// notify user follow story
		const followers = await FollowStory.find({
			storyId,
			status: "follow",
		})
			.select("userId")
			.lean();

		for (const item of followers) {
			notifications.push({
				from: authorId,
				to: item.userId.toString(),
				type: "new_chapter_from_followed_story",
				title: "Truyện bạn theo dõi vừa ra chương mới",
				content: `Truyện "${storyTitle}" vừa có chương mới${
					chapterNumber ? ` - Chương ${chapterNumber}` : ""
				}.`,
				data: {
					chapterId,
					storyId,
					storySlug,
					chapterNumber,
				},
			});
		}

		return await this.createManyNotifications(notifications);
	}

	async notifyForumPostCommented(params: {
		fromUserId: string;
		postOwnerId: string;
		forumPostId: string;
		forumCategoryId: string;
		content?: string;
	}) {
		const { fromUserId, postOwnerId, forumPostId, forumCategoryId, content } =
			params;

		if (String(fromUserId) === String(postOwnerId)) return null;

		return await this.createNotification({
			from: fromUserId,
			to: postOwnerId,
			type: "forum_post_commented",
			title: "Bài viết của bạn có bình luận mới",
			content: content
				? `Có người vừa bình luận vào bài viết của bạn: "${content.slice(0, 80)}"`
				: "Có người vừa bình luận vào bài viết của bạn.",
			data: {
				forumPostId,
				forumCategoryId,
			},
		});
	}

	async notifyForumPostReacted(params: {
		fromUserId: string;
		postOwnerId: string;
		forumPostId: string;
		forumCategoryId: string;
		react: string;
	}) {
		const { fromUserId, postOwnerId, forumPostId, forumCategoryId, react } =
			params;

		if (String(fromUserId) === String(postOwnerId)) return null;

		return await this.createNotification({
			from: fromUserId,
			to: postOwnerId,
			type: "forum_post_reacted",
			title: "Bài viết của bạn có lượt thả cảm xúc mới",
			content: `Có người vừa thả cảm xúc "${react}" vào bài viết của bạn.`,
			data: {
				forumPostId,
				forumCategoryId,
				react,
			},
		});
	}
}

export default new NotificationService();
