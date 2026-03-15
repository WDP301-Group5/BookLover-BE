import type { Request, Response } from "express";
import AdminReportService from "../services/adminReportService.js";
import {
    acknowledgeReportSchema,
    banStorySchema,
    banUserSchema,
    deleteChapterSchema,
    deleteCommentSchema,
    dismissReportSchema,
    getReportsQuerySchema,
    warnUserSchema,
} from "../utils/adminReportValidation.js";

/**
 * Get list of reports with filters and pagination
 */
export const getReports = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		// Validate query params
		const validatedData = getReportsQuerySchema.parse(req.query);

		const reports = await AdminReportService.getReports({
			status: validatedData.status,
			type: validatedData.type,
			search: validatedData.search,
			page: validatedData.page,
			limit: validatedData.limit,
		});

		res.json({
			success: true,
			message: "Reports retrieved successfully",
			data: reports,
		});
	} catch (error) {
		console.error("Error in getReports:", error);
		res.status(400).json({
			success: false,
			message: `An error occurred while fetching reports! ${error}`,
		});
	}
};

/**
 * Get report detail by ID
 */
export const getReportDetail = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;

		const report = await AdminReportService.getReportById(id);

		if (!report) {
			res.status(404).json({
				success: false,
				message: "Report not found",
			});
			return;
		}

		res.json({
			success: true,
			message: "Report retrieved successfully",
			data: report,
		});
	} catch (error) {
		console.error("Error in getReportDetail:", error);
		if ((error as Error).message === "Invalid report ID") {
			res.status(400).json({
				success: false,
				message: "Invalid report ID",
			});
			return;
		}
		res.status(500).json({
			success: false,
			message: `An error occurred while fetching report! ${error}`,
		});
	}
};

/**
 * Dismiss a report
 */
export const dismissReport = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;
		const { note } = dismissReportSchema.parse(req.body);

		const adminId = req.user?.userId;

		if (!adminId) {
			res.status(401).json({
				success: false,
				message: "Admin ID is missing",
			});
			return;
		}

		const report = await AdminReportService.dismissReport(id, adminId, note);

		res.json({
			success: true,
			message: "Report dismissed successfully",
			data: report,
		});
	} catch (error) {
		console.error("Error in dismissReport:", error);
		if ((error as Error).message === "Invalid report ID") {
			res.status(400).json({
				success: false,
				message: "Invalid report ID",
			});
			return;
		} else if ((error as Error).message === "Report not found") {
			res.status(404).json({
				success: false,
				message: "Report not found",
			});
			return;
		}
		res.status(500).json({
			success: false,
			message: `An error occurred while dismissing report! ${error}`,
		});
	}
};

/**
 * Acknowledge a report
 */
export const acknowledgeReport = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;
		const { note } = acknowledgeReportSchema.parse(req.body);

		const adminId = req.user?.userId;

		if (!adminId) {
			res.status(401).json({
				success: false,
				message: "Admin ID is missing",
			});
			return;
		}

		const report = await AdminReportService.acknowledgeReport(
			id,
			adminId,
			note,
		);

		res.json({
			success: true,
			message: "Report acknowledged successfully",
			data: report,
		});
	} catch (error) {
		console.error("Error in acknowledgeReport:", error);
		if ((error as Error).message === "Invalid report ID") {
			res.status(400).json({
				success: false,
				message: "Invalid report ID",
			});
			return;
		} else if ((error as Error).message === "Report not found") {
			res.status(404).json({
				success: false,
				message: "Report not found",
			});
			return;
		}
		res.status(500).json({
			success: false,
			message: `An error occurred while acknowledging report! ${error}`,
		});
	}
};

/**
 * Ban story from report
 */
export const banStory = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;
		const { reason } = banStorySchema.parse(req.body);

		const adminId = req.user?.userId;

		if (!adminId) {
			res.status(401).json({
				success: false,
				message: "Admin ID is missing",
			});
			return;
		}

		const story = await AdminReportService.banStory(id, adminId, reason);

		res.json({
			success: true,
			message: "Story banned successfully",
			data: story,
		});
	} catch (error) {
		console.error("Error in banStory:", error);
		if ((error as Error).message === "Invalid report ID") {
			res.status(400).json({
				success: false,
				message: "Invalid report ID",
			});
			return;
		} else if (
			(error as Error).message === "Report not found" ||
			(error as Error).message === "Story not found"
		) {
			res.status(404).json({
				success: false,
				message: (error as Error).message,
			});
			return;
		} else if (
			(error as Error).message === "Cannot ban story from comment report"
		) {
			res.status(400).json({
				success: false,
				message: (error as Error).message,
			});
			return;
		}
		res.status(500).json({
			success: false,
			message: `An error occurred while banning story! ${error}`,
		});
	}
};

/**
 * Delete chapter from report
 */
export const deleteChapter = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;
		const { reason } = deleteChapterSchema.parse(req.body);

		const adminId = req.user?.userId;

		if (!adminId) {
			res.status(401).json({
				success: false,
				message: "Admin ID is missing",
			});
			return;
		}

		const chapter = await AdminReportService.deleteChapter(
			id,
			adminId,
			reason,
		);

		res.json({
			success: true,
			message: "Chapter deleted successfully",
			data: chapter,
		});
	} catch (error) {
		console.error("Error in deleteChapter:", error);
		if ((error as Error).message === "Invalid report ID") {
			res.status(400).json({
				success: false,
				message: "Invalid report ID",
			});
			return;
		} else if (
			(error as Error).message === "Report not found" ||
			(error as Error).message === "Chapter not found"
		) {
			res.status(404).json({
				success: false,
				message: (error as Error).message,
			});
			return;
		} else if (
			(error as Error).message === "Can only delete chapter from chapter report"
		) {
			res.status(400).json({
				success: false,
				message: (error as Error).message,
			});
			return;
		}
		res.status(500).json({
			success: false,
			message: `An error occurred while deleting chapter! ${error}`,
		});
	}
};

/**
 * Delete comment from report
 */
export const deleteComment = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;
		const { reason } = deleteCommentSchema.parse(req.body);

		const adminId = req.user?.userId;

		if (!adminId) {
			res.status(401).json({
				success: false,
				message: "Admin ID is missing",
			});
			return;
		}

		const comment = await AdminReportService.deleteComment(
			id,
			adminId,
			reason,
		);

		res.json({
			success: true,
			message: "Comment deleted successfully",
			data: comment,
		});
	} catch (error) {
		console.error("Error in deleteComment:", error);
		if ((error as Error).message === "Invalid report ID") {
			res.status(400).json({
				success: false,
				message: "Invalid report ID",
			});
			return;
		} else if (
			(error as Error).message === "Report not found" ||
			(error as Error).message === "Comment not found"
		) {
			res.status(404).json({
				success: false,
				message: (error as Error).message,
			});
			return;
		} else if (
			(error as Error).message === "Can only delete comment from comment report"
		) {
			res.status(400).json({
				success: false,
				message: (error as Error).message,
			});
			return;
		}
		res.status(500).json({
			success: false,
			message: `An error occurred while deleting comment! ${error}`,
		});
	}
};

/**
 * Warn user from report
 */
export const warnUser = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;
		const { message } = warnUserSchema.parse(req.body);

		const adminId = req.user?.userId;

		if (!adminId) {
			res.status(401).json({
				success: false,
				message: "Admin ID is missing",
			});
			return;
		}

		const result = await AdminReportService.warnUser(id, adminId, message);

		res.json({
			success: true,
			message: "User warned successfully",
			data: result,
		});
	} catch (error) {
		console.error("Error in warnUser:", error);
		if ((error as Error).message === "Invalid report ID") {
			res.status(400).json({
				success: false,
				message: "Invalid report ID",
			});
			return;
		} else if (
			(error as Error).message === "Report not found" ||
			(error as Error).message === "User not found"
		) {
			res.status(404).json({
				success: false,
				message: (error as Error).message,
			});
			return;
		}
		res.status(500).json({
			success: false,
			message: `An error occurred while warning user! ${error}`,
		});
	}
};

/**
 * Ban user from report
 */
export const banUser = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;
		const { reason } = banUserSchema.parse(req.body);

		const adminId = req.user?.userId;

		if (!adminId) {
			res.status(401).json({
				success: false,
				message: "Admin ID is missing",
			});
			return;
		}

		const user = await AdminReportService.banUser(id, adminId, reason);

		res.json({
			success: true,
			message: "User banned successfully",
			data: user,
		});
	} catch (error) {
		console.error("Error in banUser:", error);
		if ((error as Error).message === "Invalid report ID") {
			res.status(400).json({
				success: false,
				message: "Invalid report ID",
			});
			return;
		} else if (
			(error as Error).message === "Report not found" ||
			(error as Error).message === "User not found"
		) {
			res.status(404).json({
				success: false,
				message: (error as Error).message,
			});
			return;
		}
		res.status(500).json({
			success: false,
			message: `An error occurred while banning user! ${error}`,
		});
	}
};

/**
 * Get report logs (history)
 */
export const getReportLogs = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;

		const logs = await AdminReportService.getReportLogs(id);

		res.json({
			success: true,
			message: "Report logs retrieved successfully",
			data: logs,
		});
	} catch (error) {
		console.error("Error in getReportLogs:", error);
		if ((error as Error).message === "Invalid report ID") {
			res.status(400).json({
				success: false,
				message: "Invalid report ID",
			});
			return;
		}
		res.status(500).json({
			success: false,
			message: `An error occurred while fetching report logs! ${error}`,
		});
	}
};
