import type { Request, Response } from "express";
import client from "../config/redis";
import { ERR_INTERNAL_SERVER } from "../consts/errorCode";
import {
	NEWCHAPTERSTORY,
	RECOMMENDSTORY,
	TOP10STORY,
} from "../consts/redisCode";
import { SUCCESS_OK } from "../consts/successCode";
import StoryService from "../services/storyService";

export const getRecommendStory = async (req: Request, res: Response) => {
	try {
		const { userId = null } = req.query;
		const storiesString = await client.get(RECOMMENDSTORY);
		let stories = storiesString ? JSON.parse(storiesString) : null;
		if (!stories) {
			stories = await StoryService.getRecommendStory(userId as string | null);
			await client.set(RECOMMENDSTORY, JSON.stringify(stories), {
				EX: 60 * 60,
			}); // 60*60s
		}
		return res.status(SUCCESS_OK).json(stories);
	} catch (error) {
		return res.status(ERR_INTERNAL_SERVER).json({
			message: "Có lỗi xảy ra khi lấy các truyện gợi ý",
			error: error,
		});
	}
};

export const getNewChapterStory = async (req: Request, res: Response) => {
	try {
		const { page = 1, limit = 24 } = req.query;
		const offset = Number(limit) * (Number(page) - 1) || 0;
		const clientKey = `${NEWCHAPTERSTORY}_${page}_${limit}`;
		const storiesString = await client.get(clientKey);
		let stories = storiesString ? JSON.parse(storiesString) : null;
		if (!stories) {
			stories = await StoryService.getNewChapterStory(
				Number(offset) || 0,
				Number(limit) || 24,
			);
			await client.set(clientKey, JSON.stringify(stories), {
				EX: 60 * 5,
			});
		}
		return res.status(SUCCESS_OK).json(stories);
	} catch (error) {
		return res.status(ERR_INTERNAL_SERVER).json({
			message: "Có lỗi xảy ra khi lấy các truyện có chương mới",
			error: error,
		});
	}
};

export const getTop10Story = async (req: Request, res: Response) => {
	try {
		const { type = "m" } = req.query;
		const clientKey = `${TOP10STORY}_${type}`;
		const storiesString = await client.get(clientKey);
		let stories = storiesString ? JSON.parse(storiesString) : null;
		if (!stories) {
			stories = await StoryService.getTop10Story(type as "m" | "w" | "d");
			await client.set(clientKey, JSON.stringify(stories), {
				EX: 60 * 30, // 30 phút
			});
		}
		return res.status(SUCCESS_OK).json(stories);
	} catch (error) {
		return res.status(ERR_INTERNAL_SERVER).json({
			message: "Có lỗi xảy ra khi lấy các truyện top 10",
			error: error,
		});
	}
};
