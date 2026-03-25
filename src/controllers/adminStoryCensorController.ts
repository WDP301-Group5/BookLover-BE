import type { Request, Response } from "express";
import {
	ERR_BAD_REQUEST,
	ERR_INTERNAL_SERVER,
	ERR_NOT_FOUND,
} from "../consts/errorCode.js";
import { SUCCESS_OK } from "../consts/successCode.js";
import AdminStoryCensorService from "../services/adminStoryCensorService.js";

export const getPendingStories = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const runAIAnalysis = req.query.ai === "true";
		const stories =
			await AdminStoryCensorService.getPendingStories(runAIAnalysis);
		res.status(SUCCESS_OK).json({ success: true, data: stories });
	} catch (error) {
		console.error("Error in getPendingStories:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `An error occurred while fetching pending stories! ${error}`,
		});
	}
};

export const getManagedStories = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const stories = await AdminStoryCensorService.getManagedStories();
		res.status(SUCCESS_OK).json({ success: true, data: stories });
	} catch (error) {
		console.error("Error in getManagedStories:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `An error occurred while fetching managed stories! ${error}`,
		});
	}
};

export const approveStory = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;
		const adminId = req.user?.userId;

		if (!adminId) {
			res
				.status(ERR_BAD_REQUEST)
				.json({ success: false, message: "Admin ID is missing" });
			return;
		}

		const story = await AdminStoryCensorService.approveStory(id, adminId);
		if (!story) {
			res
				.status(ERR_NOT_FOUND)
				.json({ success: false, message: "Pending story not found" });
			return;
		}

		res.status(SUCCESS_OK).json({
			success: true,
			message: "Story approved successfully",
			data: story,
		});
	} catch (error) {
		console.error("Error in approveStory:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `An error occurred while approving story! ${error}`,
		});
	}
};

export const rejectStory = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;
		const { reason } = req.body;
		const adminId = req.user?.userId;

		if (!adminId) {
			res
				.status(ERR_BAD_REQUEST)
				.json({ success: false, message: "Admin ID is missing" });
			return;
		}

		if (!reason) {
			res.status(ERR_BAD_REQUEST).json({
				success: false,
				message: "Reason is required to reject a story",
			});
			return;
		}

		const story = await AdminStoryCensorService.rejectStory(
			id,
			adminId,
			reason,
		);
		if (!story) {
			res
				.status(ERR_NOT_FOUND)
				.json({ success: false, message: "Pending story not found" });
			return;
		}

		res.status(SUCCESS_OK).json({
			success: true,
			message: "Story rejected successfully",
			data: story,
		});
	} catch (error) {
		console.error("Error in rejectStory:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `An error occurred while rejecting story! ${error}`,
		});
	}
};

export const banStory = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;
		const { reason } = req.body;
		const adminId = req.user?.userId;

		if (!adminId) {
			res
				.status(ERR_BAD_REQUEST)
				.json({ success: false, message: "Admin ID is missing" });
			return;
		}

		if (!reason) {
			res
				.status(ERR_BAD_REQUEST)
				.json({ success: false, message: "Reason is required to ban a story" });
			return;
		}

		const story = await AdminStoryCensorService.banStory(id, adminId, reason);
		if (!story) {
			res
				.status(ERR_NOT_FOUND)
				.json({ success: false, message: "Active story not found" });
			return;
		}

		res.status(SUCCESS_OK).json({
			success: true,
			message: "Story banned successfully",
			data: story,
		});
	} catch (error) {
		console.error("Error in banStory:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `An error occurred while banning story! ${error}`,
		});
	}
};

export const unbanStory = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;
		const adminId = req.user?.userId;

		if (!adminId) {
			res
				.status(ERR_BAD_REQUEST)
				.json({ success: false, message: "Admin ID is missing" });
			return;
		}

		const story = await AdminStoryCensorService.unbanStory(id, adminId);
		if (!story) {
			res
				.status(ERR_NOT_FOUND)
				.json({ success: false, message: "Banned story not found" });
			return;
		}

		res.status(SUCCESS_OK).json({
			success: true,
			message: "Story unbanned successfully",
			data: story,
		});
	} catch (error) {
		console.error("Error in unbanStory:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `An error occurred while unbanning story! ${error}`,
		});
	}
};

export const getStoryCensorLog = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;
		const logs = await AdminStoryCensorService.getStoryCensorLog(id);
		res.status(SUCCESS_OK).json({ success: true, data: logs });
	} catch (error) {
		console.error("Error in getStoryCensorLog:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `An error occurred while fetching story censor logs! ${error}`,
		});
	}
};
export const getStoryChapters = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;
		const chapters = await AdminStoryCensorService.getStoryChapters(id);
		res.status(SUCCESS_OK).json({ success: true, data: chapters });
	} catch (error) {
		console.error("Error in getStoryChapters:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `An error occurred while fetching story chapters! ${error}`,
		});
	}
};

// ── AI Analysis Controllers ─────────────────────────────────────────────────────

export const analyzeStory = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;
		const result = await AdminStoryCensorService.analyzeStory(id);
		if (!result) {
			res
				.status(ERR_NOT_FOUND)
				.json({ success: false, message: "Story not found" });
			return;
		}
		res.status(SUCCESS_OK).json({ success: true, data: result });
	} catch (error) {
		console.error("Error in analyzeStory:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `An error occurred while analyzing story! ${error}`,
		});
	}
};

export const getStoryAIAnalysis = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;
		const analysis = await AdminStoryCensorService.getStoryAIAnalysis(id);
		res.status(SUCCESS_OK).json({ success: true, data: analysis });
	} catch (error) {
		console.error("Error in getStoryAIAnalysis:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `An error occurred while fetching story AI analysis! ${error}`,
		});
	}
};
