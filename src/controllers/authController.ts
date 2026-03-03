import type { Request, Response } from "express";
import {
	ERR_BAD_REQUEST,
	ERR_INTERNAL_SERVER,
	ERR_UNAUTHORIZED,
} from "../consts/errorCode.js";
import { SUCCESS_OK } from "../consts/successCode.js";
import { googleLogin, loginUser } from "../services/authService.js";
import { googleLoginSchema, loginSchema } from "../utils/validation.js";

export const login = async (req: Request, res: Response): Promise<void> => {
	try {
		// Validate input
		const validatedData = loginSchema.parse(req.body);

		// Perform login
		const result = await loginUser(validatedData);

		res.status(SUCCESS_OK).json(result);
	} catch (error) {
		if (error instanceof Error) {
			// Check if it's a validation error
			if (error.name === "ZodError") {
				res.status(ERR_BAD_REQUEST).json({
					success: false,
					message: "Invalid input",
					errors: error,
				});
				return;
			}

			// Handle authentication errors
			res.status(ERR_UNAUTHORIZED).json({
				success: false,
				message: error.message,
			});
		} else {
			res.status(ERR_INTERNAL_SERVER).json({
				success: false,
				message: "An unexpected error occurred",
			});
		}
	}
};

export const googleLoginController = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		// Validate input
		const validatedData = googleLoginSchema.parse(req.body);

		// Perform Google login
		const result = await googleLogin(
			validatedData.token,
			validatedData.rememberMe || false,
		);

		res.status(SUCCESS_OK).json(result);
	} catch (error) {
		if (error instanceof Error) {
			// Check if it's a validation error
			if (error.name === "ZodError") {
				res.status(ERR_BAD_REQUEST).json({
					success: false,
					message: "Invalid input",
					errors: error,
				});
				return;
			}

			// Handle authentication errors
			res.status(ERR_UNAUTHORIZED).json({
				success: false,
				message: error.message,
			});
		} else {
			res.status(ERR_INTERNAL_SERVER).json({
				success: false,
				message: "An unexpected error occurred",
			});
		}
	}
};
