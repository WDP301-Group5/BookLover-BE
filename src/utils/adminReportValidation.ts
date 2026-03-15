import { z } from "zod";

/**
 * Schema để dismiss report
 */
export const dismissReportSchema = z.object({
	note: z.string().optional(),
});

/**
 * Schema để acknowledge report
 */
export const acknowledgeReportSchema = z.object({
	note: z.string().optional(),
});

/**
 * Schema để ban story từ report
 */
export const banStorySchema = z.object({
	reason: z.string().min(10, "Reason must be at least 10 characters"),
});

/**
 * Schema để delete chapter từ report
 */
export const deleteChapterSchema = z.object({
	reason: z.string().min(10, "Reason must be at least 10 characters"),
});

/**
 * Schema để delete comment từ report
 */
export const deleteCommentSchema = z.object({
	reason: z.string().min(10, "Reason must be at least 10 characters"),
});

/**
 * Schema để warn user từ report
 */
export const warnUserSchema = z.object({
	message: z.string().min(10, "Message must be at least 10 characters"),
});

/**
 * Schema để ban user từ report
 */
export const banUserSchema = z.object({
	reason: z.string().min(10, "Reason must be at least 10 characters"),
});

/**
 * Schema để lấy danh sách reports
 */
export const getReportsQuerySchema = z.object({
	status: z.enum(["pending", "success", "failed"]).optional(),
	type: z.enum(["Story", "Chapter", "Comment"]).optional(),
	search: z.string().optional(),
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(20),
});

export type DismissReportInput = z.infer<typeof dismissReportSchema>;
export type AcknowledgeReportInput = z.infer<typeof acknowledgeReportSchema>;
export type BanStoryInput = z.infer<typeof banStorySchema>;
export type DeleteChapterInput = z.infer<typeof deleteChapterSchema>;
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
export type WarnUserInput = z.infer<typeof warnUserSchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
export type GetReportsQueryInput = z.infer<typeof getReportsQuerySchema>;
