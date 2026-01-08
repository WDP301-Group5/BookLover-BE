import type { Request, Response } from "express";
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
