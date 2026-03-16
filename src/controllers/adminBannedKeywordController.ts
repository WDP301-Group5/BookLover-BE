import type { Request, Response } from "express";
import mongoose from "mongoose";
import { ERR_INTERNAL_SERVER, ERR_NOT_FOUND } from "../consts/errorCode.js";
import { SUCCESS_OK } from "../consts/successCode.js";
import BannedKeywordService from "../services/bannedKeywordService.js";

export const getAllBannedKeywords = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { category } = req.query;
		const keywords = category
			? await BannedKeywordService.getKeywordsByCategory(category as string)
			: await BannedKeywordService.getAllKeywords();

		res.status(SUCCESS_OK).json({
			success: true,
			data: keywords,
		});
	} catch (error) {
		console.error("Error in getAllBannedKeywords:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `Error getting banned keywords: ${error}`,
		});
	}
};

export const getBannedKeywordById = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;
		const keyword = await BannedKeywordService.getKeywordById(id);

		if (!keyword) {
			res.status(ERR_NOT_FOUND).json({
				success: false,
				message: "Keyword not found",
			});
			return;
		}

		res.status(SUCCESS_OK).json({
			success: true,
			data: keyword,
		});
	} catch (error) {
		console.error("Error in getBannedKeywordById:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `Error getting keyword: ${error}`,
		});
	}
};

export const createBannedKeyword = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const adminId = req.user?.userId;
		if (!adminId) {
			res.status(ERR_INTERNAL_SERVER).json({
				success: false,
				message: "Admin not found",
			});
			return;
		}

		const { text, category, severity, isRegex } = req.body;

		if (!text || !category) {
			res.status(ERR_INTERNAL_SERVER).json({
				success: false,
				message: "Text and category are required",
			});
			return;
		}

		const keyword = await BannedKeywordService.createKeyword({
			text,
			category,
			severity: severity || "medium",
			isRegex: isRegex || false,
			createdBy: new mongoose.Types.ObjectId(adminId),
		});

		res.status(SUCCESS_OK).json({
			success: true,
			data: keyword,
		});
	} catch (error) {
		console.error("Error in createBannedKeyword:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `Error creating keyword: ${error}`,
		});
	}
};

export const updateBannedKeyword = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;
		const { text, category, severity, isRegex, isActive } = req.body;

		const updateData: Record<string, unknown> = {};
		if (text) updateData.text = text;
		if (category) updateData.category = category;
		if (severity) updateData.severity = severity;
		if (typeof isRegex === "boolean") updateData.isRegex = isRegex;
		if (typeof isActive === "boolean") updateData.isActive = isActive;

		const keyword = await BannedKeywordService.updateKeyword(id, updateData);

		if (!keyword) {
			res.status(ERR_NOT_FOUND).json({
				success: false,
				message: "Keyword not found",
			});
			return;
		}

		res.status(SUCCESS_OK).json({
			success: true,
			data: keyword,
		});
	} catch (error) {
		console.error("Error in updateBannedKeyword:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `Error updating keyword: ${error}`,
		});
	}
};

export const deleteBannedKeyword = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;
		const { hard } = req.query;

		const success =
			hard === "true"
				? await BannedKeywordService.hardDeleteKeyword(id)
				: await BannedKeywordService.deleteKeyword(id);

		if (!success) {
			res.status(ERR_NOT_FOUND).json({
				success: false,
				message: "Keyword not found",
			});
			return;
		}

		res.status(SUCCESS_OK).json({
			success: true,
			message:
				hard === "true" ? "Keyword permanently deleted" : "Keyword deactivated",
		});
	} catch (error) {
		console.error("Error in deleteBannedKeyword:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `Error deleting keyword: ${error}`,
		});
	}
};
