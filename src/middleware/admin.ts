import type { NextFunction, Request, Response } from "express";
import { ERR_FORBIDDEN } from "../consts/errorCode.js";
import { verifyToken } from "./auth.js";

/**
 * Middleware bảo vệ route dành cho admin
 * Yêu cầu user đã đăng nhập và có role "admin"
 */
export const requireAdmin = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	verifyToken(req, res, () => {
		// verifyToken đã call next() thành công → token hợp lệ
		// Giờ kiểm tra role
		if (req.user?.role !== "admin") {
			res.status(ERR_FORBIDDEN).json({
				success: false,
				message: "Admin access required",
			});
			return;
		}

		// User là admin → tiếp tục
		next();
	});
};
