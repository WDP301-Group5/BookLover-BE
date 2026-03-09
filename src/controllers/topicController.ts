import type { Request, Response } from "express";
import { ERR_INTERNAL_SERVER } from "../consts/errorCode";
import { SUCCESS_OK } from "../consts/successCode";
import TopicService from "../services/topicService";

export const getTopics = async (_: Request, res: Response) => {
	try {
		const topics = await TopicService.getTopics();
		return res.status(SUCCESS_OK).json(topics);
	} catch (error) {
		return res.status(ERR_INTERNAL_SERVER).json({
			message: "Có lỗi xảy ra khi lấy danh sách chủ đề",
			error: error,
		});
	}
};
