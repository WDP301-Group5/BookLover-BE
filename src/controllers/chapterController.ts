// src/controllers/chapterPageController.ts

import axios from "axios";
import type { Request, Response } from "express";
import { ERR_FORBIDDEN, ERR_INTERNAL_SERVER } from "../consts/errorCode";
import { SUCCESS_OK } from "../consts/successCode";
import * as chapterService from "../services/chapterService";
import StoryService from "../services/storyService";
import TransactionService from "../services/transactionService";

export const createChapter = async (req: Request, res: Response) =>
	res.json(await chapterService.createChapter(req.body));

export const getChaptersByStory = async (req: Request, res: Response) => {
	try {
		const chapters = await chapterService.getChaptersByStory(
			req.params.storyId,
		);
		return res.status(SUCCESS_OK).json(chapters);
	} catch (error: unknown) {
		return res.status(ERR_INTERNAL_SERVER).json({
			message: `Có lỗi xảy ra khi lấy danh sách chương: ${(error as Error).message}`,
		});
	}
};

export const getChapterByChapterNumber = async (
	req: Request,
	res: Response,
) => {
	const userId = req.user ? req.user.userId : undefined;
	try {
		const storyId = await StoryService.getStoryIdBySlug(req.params.storySlug);
		const chapter = await chapterService.getChapterByChapterNumber(
			storyId,
			Number(req.params.chapterNumber),
		);
		if (!chapter) {
			return res.status(SUCCESS_OK).json({ message: "Chương không tồn tại" });
		}
		chapter.id = chapter._id.toString();
		if (chapter.isPremium && chapter.price > 0) {
			if (!userId) {
				return res.status(ERR_FORBIDDEN).json({
					message: "Bạn cần đăng nhập và mua chương này để xem nội dung.",
				});
			} else {
				const hasPurchased = await TransactionService.checkUserPurchasedChapter(
					userId,
					chapter.id,
				);
				if (!hasPurchased) {
					return res
						.status(ERR_FORBIDDEN)
						.json({ message: "Bạn cần mua chương này để xem nội dung." });
				}
			}
		}
		const text = await axios
			.get(chapter.contentURL, { responseType: "text" })
			.then((res) => res.data)
			.catch((err) => {
				console.log("Error when get text from cloudinary", err);
			});
		chapter.contentURL = text;
		return res.status(SUCCESS_OK).json(chapter);
	} catch (error: unknown) {
		return res.status(ERR_INTERNAL_SERVER).json({
			message: `Có lỗi xảy ra khi lấy thông tin chương: ${(error as Error).message}`,
		});
	}
};

export const updateChapter = async (req: Request, res: Response) =>
	res.json(await chapterService.updateChapter(req.params.id, req.body));

export const deleteChapter = async (req: Request, res: Response) =>
	res.json(await chapterService.deleteChapter(req.params.id));

export const testFileUpload = async (req: Request, res: Response) => {
	try {
		if (!req.body.file) {
			console.log("=============> ko có file");
			return res
				.status(400)
				.json({ message: "Chưa có file nào được gửi lên." });
		}
		console.log("File đã được upload thành công:", req.body.file);
		res.json({
			message: "File đã được upload thành công",
			file: req.body.file,
		});
	} catch (_error) {
		return res.status(500).json({ message: "Có lỗi xảy ra khi upload file." });
	}
};
