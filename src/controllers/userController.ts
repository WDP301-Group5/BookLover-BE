import type { Request, Response } from "express";
import ReadingHistoryService from "../services/readingHistoryService.js";
import UserService from "../services/userService.js";

export const getAllUsers = async (_req: Request, res: Response) => {
	try {
		const users = await UserService.getAllUsers();
		res.status(200).json({
			success: true,
			message: "Get all users successfully!",
			data: users,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: `An error occured during getting all users! ${error}.`,
		});
	}
};

export const getLast3History = async (req: Request, res: Response) => {
	try {
		const { userId } = req.query;
		const history = await ReadingHistoryService.getLast3History(
			userId as string,
		);
		res.status(200).json({
			success: true,
			message: "Get last 3 history successfully!",
			data: history,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: `An error occured during getting last 3 history! ${error}.`,
		});
	}
};
