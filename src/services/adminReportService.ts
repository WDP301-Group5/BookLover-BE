import { Types } from "mongoose";
import type { IReport } from "../interfaces/report.js";
import type { ReportAction } from "../interfaces/reportLog.js";
import { CensorLog } from "../models/CensorLog.js";
import { Chapter } from "../models/Chapter.js";
import { Comment } from "../models/Comment.js";
import { Notification } from "../models/Notification.js";
import { Report } from "../models/Report.js";
import { ReportLog } from "../models/ReportLog.js";
import { Story } from "../models/Story.js";
import { User } from "../models/User.js";

interface GetReportsOptions {
	status?: "pending" | "success" | "failed";
	type?: "Story" | "Chapter" | "Comment";
	search?: string;
	page?: number;
	limit?: number;
}

interface ReportWithTarget extends Omit<IReport, "_id"> {
	_id: string;
	targetPreview?: {
		title?: string;
		authorName?: string;
		status?: string;
		image?: string;
		chapterNumber?: number;
		content?: string;
	};
	reporterName?: string;
	reporterUsername?: string;
}

const AdminReportService = {
	/**
	 * Lấy danh sách reports với filters và pagination
	 */
	async getReports(options: GetReportsOptions) {
		try {
			const {
				status = "pending",
				type,
				search,
				page = 1,
				limit = 20,
			} = options;

			// Build query
			const query: any = { status };

			if (type) {
				query.type = type;
			}

			if (search) {
				// Will search in report content and will be populated later
				query.content = { $regex: search, $options: "i" };
			}

			// Get reports with pagination
			const reports = await Report.find(query)
				.sort({ createdAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit)
				.lean();

			const total = await Report.countDocuments(query);

			// Populate target information and reporter info
			const reportsWithTargets = await Promise.all(
				reports.map(async (report: any) => {
					const reportObj = { ...report } as unknown as ReportWithTarget;
					reportObj._id = report._id.toString();

					// Get reporter info
					const reporter = await User.findById(report.userId).select(
						"username fullName avatarURL",
					);
					if (reporter) {
						reportObj.reporterName = reporter.fullName;
						reportObj.reporterUsername = reporter.username;
					}

					// Get target preview based on type
					if (report.type === "Story") {
						const story = await Story.findById(report.reportId)
							.select("title authorId status image")
							.populate("authorId", "fullName")
							.lean();
						if (story) {
							reportObj.targetPreview = {
								title: story.title,
								authorName: (story.authorId as any)?.fullName,
								status: story.status,
								image: story.image,
							};
						}
					} else if (report.type === "Chapter") {
						const chapter = await Chapter.findById(report.reportId)
							.select("storyId chapterNumber title status")
							.populate({
								path: "storyId",
								select: "title authorId image",
								populate: {
									path: "authorId",
									select: "fullName",
								},
							})
							.lean();
						if (chapter) {
							reportObj.targetPreview = {
								title: (chapter.storyId as any)?.title,
								authorName: (chapter.storyId as any)?.authorId?.fullName,
								status: chapter.status,
								chapterNumber: chapter.chapterNumber,
							};
						}
					} else if (report.type === "Comment") {
						const comment = await Comment.findById(report.reportId)
							.select("content status")
							.populate("userId", "fullName username")
							.lean();
						if (comment) {
							reportObj.targetPreview = {
								content: comment.content,
								status: comment.status,
							};
						}
					}

					return reportObj;
				}),
			);

			return {
				reports: reportsWithTargets,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		} catch (error) {
			throw new Error(`Error fetching reports: ${error}`);
		}
	},

	/**
	 * Lấy chi tiết 1 report
	 */
	async getReportById(reportId: string): Promise<ReportWithTarget | null> {
		try {
			if (!Types.ObjectId.isValid(reportId)) {
				throw new Error("Invalid report ID");
			}

			const report = await Report.findById(reportId).lean();
			if (!report) {
				return null;
			}

			const reportObj = { ...report } as unknown as ReportWithTarget;
			reportObj._id = report._id.toString();

			// Get reporter info
			const reporter = await User.findById(report.userId).select(
				"username fullName avatarURL",
			);
			if (reporter) {
				reportObj.reporterName = reporter.fullName;
				reportObj.reporterUsername = reporter.username;
			}

			// Get target preview based on type
			if (report.type === "Story") {
				const story = await Story.findById(report.reportId)
					.select("title authorId status image description")
					.populate("authorId", "fullName username")
					.lean();
				if (story) {
					reportObj.targetPreview = {
						title: story.title,
						authorName: (story.authorId as any)?.fullName,
						status: story.status,
						image: story.image,
					};
				}
			} else if (report.type === "Chapter") {
				const chapter = await Chapter.findById(report.reportId)
					.select("storyId chapterNumber title status contentURL")
					.populate({
						path: "storyId",
						select: "title authorId image",
						populate: {
							path: "authorId",
							select: "fullName username",
						},
					})
					.lean();
				if (chapter) {
					reportObj.targetPreview = {
						title: (chapter.storyId as any)?.title,
						authorName: (chapter.storyId as any)?.authorId?.fullName,
						status: chapter.status,
						chapterNumber: chapter.chapterNumber,
					};
				}
			} else if (report.type === "Comment") {
				const comment = await Comment.findById(report.reportId)
					.select("content status chapterId")
					.populate("userId", "fullName username")
					.lean();
				if (comment) {
					reportObj.targetPreview = {
						content: comment.content,
						status: comment.status,
					};
				}
			}

			return reportObj;
		} catch (error) {
			throw new Error(`Error fetching report: ${error}`);
		}
	},

	/**
	 * Dismiss a report (mark as invalid/failed)
	 */
	async dismissReport(reportId: string, adminId: string, note?: string) {
		try {
			if (!Types.ObjectId.isValid(reportId)) {
				throw new Error("Invalid report ID");
			}

			const report = await Report.findByIdAndUpdate(
				reportId,
				{
					status: "failed",
					resolvedAt: new Date(),
					resolvedBy: adminId,
				},
				{ new: true },
			);

			if (!report) {
				throw new Error("Report not found");
			}

			// Create ReportLog
			await ReportLog.create({
				reportId,
				adminId,
				action: "dismiss" as ReportAction,
				note,
			});

			return report;
		} catch (error) {
			throw new Error(`Error dismissing report: ${error}`);
		}
	},

	/**
	 * Acknowledge a report (mark as valid but no immediate action)
	 */
	async acknowledgeReport(reportId: string, adminId: string, note?: string) {
		try {
			if (!Types.ObjectId.isValid(reportId)) {
				throw new Error("Invalid report ID");
			}

			const report = await Report.findByIdAndUpdate(
				reportId,
				{
					status: "success",
					resolvedAt: new Date(),
					resolvedBy: adminId,
				},
				{ new: true },
			);

			if (!report) {
				throw new Error("Report not found");
			}

			// Create ReportLog
			await ReportLog.create({
				reportId,
				adminId,
				action: "acknowledge" as ReportAction,
				note,
			});

			return report;
		} catch (error) {
			throw new Error(`Error acknowledging report: ${error}`);
		}
	},

	/**
	 * Ban a story from report
	 */
	async banStory(reportId: string, adminId: string, reason: string) {
		try {
			if (!Types.ObjectId.isValid(reportId)) {
				throw new Error("Invalid report ID");
			}

			const report = await Report.findById(reportId);
			if (!report) {
				throw new Error("Report not found");
			}

			// Find the story
			let storyId: any = report.reportId;
			if (report.type === "Chapter") {
				// If report is for chapter, get the story from chapter
				const chapter = await Chapter.findById(report.reportId);
				if (!chapter) {
					throw new Error("Chapter not found");
				}
				storyId = chapter.storyId;
			} else if (report.type === "Comment") {
				throw new Error("Cannot ban story from comment report");
			}

			const story = await Story.findByIdAndUpdate(
				storyId,
				{ status: "banned" },
				{ new: true },
			);

			if (!story) {
				throw new Error("Story not found");
			}

			// Update report status
			await Report.findByIdAndUpdate(reportId, {
				status: "success",
				resolvedAt: new Date(),
				resolvedBy: adminId,
			});

			// Create ReportLog
			await ReportLog.create({
				reportId,
				adminId,
				action: "ban_story" as ReportAction,
				note: reason,
				metadata: { storyBanned: true },
			});

			// Create CensorLog
			await CensorLog.create({
				storyId,
				adminId,
				action: "ban",
				reason,
			});

			// Notify author
			const admin = await User.findById(adminId).select("username").lean();
			await Notification.create({
				from: "system",
				to: story.authorId,
				type: "chapter_approved", // Using existing type as placeholder
				title: "Truyện bị cấm",
				content: `Truyện "${story.title}" của bạn đã bị cấm vì lý do: ${reason}`,
				data: {
					adminUsername: admin?.username,
					reason,
					storyId: story._id.toString(),
				},
			});

			return story;
		} catch (error) {
			throw new Error(`Error banning story: ${error}`);
		}
	},

	/**
	 * Delete a chapter from report
	 */
	async deleteChapter(reportId: string, adminId: string, reason: string) {
		try {
			if (!Types.ObjectId.isValid(reportId)) {
				throw new Error("Invalid report ID");
			}

			const report = await Report.findById(reportId);
			if (!report) {
				throw new Error("Report not found");
			}

			if (report.type !== "Chapter") {
				throw new Error("Can only delete chapter from chapter report");
			}

			const chapter = await Chapter.findById(report.reportId);
			if (!chapter) {
				throw new Error("Chapter not found");
			}

			// Soft delete the chapter
			chapter.status = "banned";
			await chapter.save();

			// Update report status
			await Report.findByIdAndUpdate(reportId, {
				status: "success",
				resolvedAt: new Date(),
				resolvedBy: adminId,
			});

			// Create ReportLog
			await ReportLog.create({
				reportId,
				adminId,
				action: "delete_chapter" as ReportAction,
				note: reason,
				metadata: { chapterDeleted: true },
			});

			// Create CensorLog
			await CensorLog.create({
				chapterId: chapter._id,
				storyId: chapter.storyId,
				adminId,
				action: "delete_chapter",
				reason,
			});

			// Notify author
			const story = await Story.findById(chapter.storyId);
			const admin = await User.findById(adminId).select("username").lean();
			if (story) {
				await Notification.create({
					from: "system",
					to: story.authorId,
					type: "system",
					title: "Chương bị xóa",
					content: `Chương "${chapter.title}" của truyện "${story.title}" đã bị xóa vì lý do: ${reason}`,
					data: {
						adminUsername: admin?.username,
						reason,
						chapterId: chapter._id.toString(),
					},
				});
			}

			return chapter;
		} catch (error) {
			throw new Error(`Error deleting chapter: ${error}`);
		}
	},

	/**
	 * Delete a comment from report
	 */
	async deleteComment(reportId: string, adminId: string, reason: string) {
		try {
			if (!Types.ObjectId.isValid(reportId)) {
				throw new Error("Invalid report ID");
			}

			const report = await Report.findById(reportId);
			if (!report) {
				throw new Error("Report not found");
			}

			if (report.type !== "Comment") {
				throw new Error("Can only delete comment from comment report");
			}

			const comment = await Comment.findById(report.reportId);
			if (!comment) {
				throw new Error("Comment not found");
			}

			// Soft delete the comment
			comment.status = "blocked";
			await comment.save();

			// Update report status
			await Report.findByIdAndUpdate(reportId, {
				status: "success",
				resolvedAt: new Date(),
				resolvedBy: adminId,
			});

			// Create ReportLog
			await ReportLog.create({
				reportId,
				adminId,
				action: "delete_comment" as ReportAction,
				note: reason,
				metadata: { commentDeleted: true },
			});

			// Notify comment owner
			const admin = await User.findById(adminId).select("username").lean();
			await Notification.create({
				from: "system",
				to: comment.userId,
				type: "system",
				title: "Bình luận bị xóa",
				content: `Bình luận của bạn đã bị xóa vì lý do: ${reason}`,
				data: {
					adminUsername: admin?.username,
					reason,
					commentId: comment._id.toString(),
				},
			});

			return comment;
		} catch (error) {
			throw new Error(`Error deleting comment: ${error}`);
		}
	},

	/**
	 * Warn a user from report
	 */
	async warnUser(reportId: string, adminId: string, message: string) {
		try {
			if (!Types.ObjectId.isValid(reportId)) {
				throw new Error("Invalid report ID");
			}

			const report = await Report.findById(reportId);
			if (!report) {
				throw new Error("Report not found");
			}

			// Get the user to warn based on report type
			let userId: any;
			if (report.type === "Story") {
				const story = await Story.findById(report.reportId);
				userId = story?.authorId;
			} else if (report.type === "Chapter") {
				const chapter = await Chapter.findById(report.reportId);
				if (chapter) {
					const story = await Story.findById(chapter.storyId);
					userId = story?.authorId;
				}
			} else {
				// Comment
				const comment = await Comment.findById(report.reportId);
				userId = comment?.userId;
			}

			if (!userId) {
				throw new Error("User not found");
			}

			// Update report status
			await Report.findByIdAndUpdate(reportId, {
				status: "success",
				resolvedAt: new Date(),
				resolvedBy: adminId,
			});

			// Create ReportLog
			await ReportLog.create({
				reportId,
				adminId,
				action: "warn_user" as ReportAction,
				note: message,
				metadata: { userWarned: true },
			});

			// Create notification for the user
			const admin = await User.findById(adminId).select("username").lean();
			await Notification.create({
				from: "system",
				to: userId,
				type: "warning",
				title: "Cảnh cáo từ Admin",
				content: message,
				data: {
					adminUsername: admin?.username,
					message,
				},
			});

			return { userId, warned: true };
		} catch (error) {
			throw new Error(`Error warning user: ${error}`);
		}
	},

	/**
	 * Ban a user from report
	 */
	async banUser(reportId: string, adminId: string, reason: string) {
		try {
			if (!Types.ObjectId.isValid(reportId)) {
				throw new Error("Invalid report ID");
			}

			const report = await Report.findById(reportId);
			if (!report) {
				throw new Error("Report not found");
			}

			// Get the user to ban based on report type
			let userId: any;
			if (report.type === "Story") {
				const story = await Story.findById(report.reportId);
				userId = story?.authorId;
			} else if (report.type === "Chapter") {
				const chapter = await Chapter.findById(report.reportId);
				if (chapter) {
					const story = await Story.findById(chapter.storyId);
					userId = story?.authorId;
				}
			} else {
				// Comment
				const comment = await Comment.findById(report.reportId);
				userId = comment?.userId;
			}

			if (!userId) {
				throw new Error("User not found");
			}

			// Ban the user
			const user = await User.findByIdAndUpdate(
				userId,
				{ status: "banned" },
				{ new: true },
			);

			if (!user) {
				throw new Error("User not found");
			}

			// Update report status
			await Report.findByIdAndUpdate(reportId, {
				status: "success",
				resolvedAt: new Date(),
				resolvedBy: adminId,
			});

			// Create ReportLog
			await ReportLog.create({
				reportId,
				adminId,
				action: "ban_user" as ReportAction,
				note: reason,
				metadata: { userBanned: true },
			});

			// Note: CensorLog is only for story/chapter actions, not user actions
			// User ban history is tracked in ReportLog and User.status

			// Notify the user
			const admin = await User.findById(adminId).select("username").lean();
			await Notification.create({
				from: "system",
				to: userId,
				type: "system",
				title: "Tài khoản bị khóa",
				content: `Tài khoản của bạn đã bị khóa vì lý do: ${reason}`,
				data: {
					adminUsername: admin?.username,
					reason,
					bannedUserId: userId.toString(),
				},
			});

			return user;
		} catch (error) {
			throw new Error(`Error banning user: ${error}`);
		}
	},

	/**
	 * Get report logs (history)
	 */
	async getReportLogs(reportId: string) {
		try {
			if (!Types.ObjectId.isValid(reportId)) {
				throw new Error("Invalid report ID");
			}

			const logs = await ReportLog.find({ reportId })
				.sort({ createdAt: -1 })
				.populate("adminId", "username fullName avatarURL")
				.lean();

			return logs;
		} catch (error) {
			throw new Error(`Error fetching report logs: ${error}`);
		}
	},
};

export default AdminReportService;
