import type { Request, Response } from "express";
import { ERR_INTERNAL_SERVER, ERR_INVALID_TOKEN } from "../consts/errorCode";
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

export const getOneTopic = async (req: Request, res: Response) => {
	try {
		const topic = await TopicService.getOneTopic(req.params.id);
		return res.status(SUCCESS_OK).json(topic);
	} catch (error) {
		return res.status(ERR_INTERNAL_SERVER).json({
			message: "Có lỗi xảy ra khi lấy chủ đề",
			error: error,
		});
	}
};

export const getAllTopics = async (req: Request, res: Response) => {
	try {
		const userId = req.user ? req.user.userId : undefined;
		if (!userId) {
			return res
				.status(ERR_INVALID_TOKEN)
				.json({ message: "Người dùng không tồn tại." });
		}
		const topics = await TopicService.getAllTopics();
		return res.status(SUCCESS_OK).json(topics);
	} catch (error) {
		return res.status(ERR_INTERNAL_SERVER).json({
			message: "Có lỗi xảy ra khi lấy danh sách chủ đề",
			error: error,
		});
	}
};

export const createTopic = async (req: Request, res: Response) => {
	try {
		const topics = await TopicService.createTopic(req.body);
		return res.status(SUCCESS_OK).json(topics);
	} catch (error) {
		return res.status(ERR_INTERNAL_SERVER).json({
			message: "Có lỗi xảy ra khi tạo chủ đề",
			error: error,
		});
	}
}

export const updateTopic = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const topics = await TopicService.updateTopic(String(id), req.body);
		return res.status(SUCCESS_OK).json(topics);
	} catch (error) {
		return res.status(ERR_INTERNAL_SERVER).json({
			message: "Có lỗi xảy ra khi cập nhật chủ đề",
			error: error,
		});
	}
};

export const deleteManyTopics = async (req: Request, res: Response) => {
	try {
		const { ids } = req.body;
		const topics = await TopicService.deleteManyTopics(ids);
		return res.status(SUCCESS_OK).json(topics);
	} catch (error) {
		return res.status(ERR_INTERNAL_SERVER).json({
			message: "Có lỗi xảy ra khi xóa chủ đề",
			error: error,
		});
	}
}

export const deleteTopic = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const topics = await TopicService.deleteTopic(String(id));
		return res.status(SUCCESS_OK).json(topics);
	} catch (error) {
		return res.status(ERR_INTERNAL_SERVER).json({
			message: "Có lỗi xảy ra khi xóa chủ đề",
			error: error,
		});
	}
};
