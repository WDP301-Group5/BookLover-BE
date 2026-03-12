// src/controllers/storyController.ts
import type { Request, Response } from "express";
import client from "../config/redis";
import { ERR_BAD_REQUEST, ERR_INTERNAL_SERVER } from "../consts/errorCode";
import {
  NEWCHAPTERSTORY,
  RECOMMENDSTORY,
  TOP10STORY,
} from "../consts/redisCode";
import { SUCCESS_CREATED, SUCCESS_OK } from "../consts/successCode";
import StoryService from "../services/storyService";
import UserService from "../services/userService";
import StoryViewService from "../services/storyViewService";

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

export const getNewChapterStoryWithFilter = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 24, status, category, search, sortBy } = req.query;

    const result = await StoryService.getNewChapterStoryWithFilter({
      offset: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
      status: status as string,
      category: category as string,
      search: search as string,
      sortBy: sortBy as string,
    });

    return res.status(SUCCESS_OK).json(result);
  } catch (error) {
    console.error("Error fetching new chapter stories:", error);
    return res.status(ERR_INTERNAL_SERVER).json({
      message: "Có lỗi xảy ra khi lấy các truyện có chương mới",
      error,
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

export const createStory = async (req: Request, res: Response) => {
  try {
    const data = {
      ...req.body,
      authorId: req.user?.userId,
      image: req.body.image,
    };
    const story = await StoryService.createStory(data);
    return res.status(SUCCESS_OK).json(story);
  } catch (error) {
    return res.status(ERR_INTERNAL_SERVER).json({
      message: "Có lỗi xảy ra khi tạo truyện",
      error: error,
    });
  }
};

export const getMyStories = async (req: Request, res: Response) => {
  try {
    const stories = await StoryService.getStoriesByAuthor(
      req.user?.userId as string,
    );
    return res.status(SUCCESS_OK).json(stories);
  } catch (error) {
    return res.status(ERR_INTERNAL_SERVER).json({
      message: "Có lỗi xảy ra khi lấy danh sách truyện của bạn",
      error: error,
    });
  }
};

export const getStories = async (_: Request, res: Response) => {
  try {
    const stories = await StoryService.getStories();
    return res.status(SUCCESS_OK).json(stories);
  } catch (error) {
    return res.status(ERR_INTERNAL_SERVER).json({
      message: "Có lỗi xảy ra khi lấy danh sách truyện",
      error: error,
    });
  }
};

export const getStoryBySlug = async (req: Request, res: Response) => {
  try {
    const story = await StoryService.getStoryBySlug(req.params.slug);
    return res.status(SUCCESS_OK).json(story);
  } catch (error) {
    return res.status(ERR_INTERNAL_SERVER).json({
      message: "Có lỗi xảy ra khi lấy truyện theo slug",
      error: error,
    });
  }
};

export const updateStory = async (req: Request, res: Response) => {
  try {
    const story = await StoryService.updateStory(req.params.id, req.body);
    return res.status(SUCCESS_OK).json(story);
  } catch (error) {
    return res.status(ERR_INTERNAL_SERVER).json({
      message: "Có lỗi xảy ra khi cập nhật truyện",
      error: error,
    });
  }
};

export const deleteStory = async (req: Request, res: Response) => {
	try {
		await StoryService.deleteStory(req.params.id);
		return res
			.status(SUCCESS_OK)
			.json({ message: "Story deleted successfully" });
	} catch (error) {
		return res.status(ERR_INTERNAL_SERVER).json({
			message: "Có lỗi xảy ra khi xóa truyện",
			error: error,
		});
	}
};

export const readChapter = async (req: Request, res: Response) => {
	const userId = req.user ? req.user.userId : undefined;
	const storyId = req.params.storyId;
	try {
		if (!storyId) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Không có thông tin truyện" });
		}
		const chapterNumber = req.body.chapterNumber || 0;
		if (userId && chapterNumber > 0) {
			await UserService.saveHistory(userId, storyId, chapterNumber);
		}
		const read = await StoryService.viewStory(storyId);
    await StoryViewService.addNewView(storyId);
		return res.status(SUCCESS_CREATED).json({
			success: !!read,
			message: "Story viewed successfully",
		});
	} catch (error) {
		return res
			.status(ERR_INTERNAL_SERVER)
			.json({ message: "Có lỗi xảy ra khi người dùng xem truyện.", error });
	}
};

export const getStoryWithAuthor = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const story = await StoryService.getStoryWithAuthor(slug);
  if (!story) return res.status(404).json({ message: "Not found" });
  return res.json(story);
};
