import type { Request, Response } from "express";
import { ERR_BAD_REQUEST, ERR_INTERNAL_SERVER } from "../consts/errorCode";
import { SUCCESS_OK } from "../consts/successCode";
import FollowStoryService from "../services/followStoryService";

export const checkUserFollowStory = async (req: Request, res: Response) => {
	try {
		const userId = req.user ? req.user.userId : undefined;
		if (!userId) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Không có thông tin người dùng" });
		}
		const storyId = req.params.storyId;

		if (!storyId) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Không có thông tin truyện" });
		}

		const result = await FollowStoryService.checkUserFollowStory(
			userId,
			storyId,
		);
		res.status(SUCCESS_OK).json(result);
	} catch (error) {
		res.status(ERR_INTERNAL_SERVER).json({ error: (error as Error).message });
	}
};

export const changeStatusFollowStory = async (req: Request, res: Response) => {
	try {
		const userId = req.user ? req.user.userId : undefined;
		if (!userId) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Không có thông tin người dùng" });
		}

		const storyId = req.params.storyId;

		if (!storyId) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ message: "Không có thông tin truyện" });
		}

		const status = req.body.status;

		const result = await FollowStoryService.changeStatusFollowStory(
			userId,
			storyId,
			status,
		);
		res.status(SUCCESS_OK).json(result);
	} catch (error) {
		res
			.status(ERR_INTERNAL_SERVER)
			.json({ message: "Error follow story", error });
	}
};
