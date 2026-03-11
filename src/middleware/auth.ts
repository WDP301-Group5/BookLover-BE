import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ERR_INVALID_TOKEN } from "../consts/errorCode.js";
import type { JwtPayload } from "../interfaces/jwtPayload.js";

/**
 * Middleware bảo vệ route cần Access Token
 */

// khai báo kiểu dữ liệu global cho req
declare global {
	namespace Express {
		interface Request {
			user?: JwtPayload;
		}
	}
}
export const verifyToken = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const header = req.headers.authorization;
	if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
		res.status(ERR_INVALID_TOKEN).json({ message: "Missing token" });
		return;
	}

	const token = header.split(" ")[1];
	try {
		const decoded = jwt.verify(
			token,
			process.env.JWT_ACCESS_SECRET ?? "access_secret",
		) as JwtPayload;

		req.user = decoded;
		// { id, fullName, nickName?, role }

		next();
	} catch (err: unknown) {
		if ((err as Error)?.name === "TokenExpiredError") {
			console.log("Token đã hết hạn");
			res.status(ERR_INVALID_TOKEN).json({ message: "Token đã hết hạn" });
		} else {
			console.log("Token không hợp lệ:", (err as Error)?.message ?? err);
			res.status(ERR_INVALID_TOKEN).json({ message: "Token không hợp lệ" });
		}
		return;
	}
};

export const checkToken = (
	// hàm để kiểm tra xem người dùng đã đăng nhập hay chưa
	// để từ đó xử lý dữ liệu dựa theo thông tin người dùng
	req: Request,
	_res: Response,
	next: NextFunction,
): void => {
	const header = req.headers.authorization;
	if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
		next();
		return;
	}
	const token = header.split(" ")[1];
	try {
		const decoded = jwt.verify(
			token,
			process.env.JWT_ACCESS_SECRET ?? "access_secret",
		) as JwtPayload;

		req.user = decoded;
		next(); // nếu có token thì giải mã và gán thông tin user
	} catch (_err) {
		next(); // vẫn call next để chạy hàm phía sau nhưng không cung cấp thông tin user
		// các hàm phía sau khi gọi hàm này thì sẽ phải tự xử lý trường hợp không có thông tin user
	}
	return;
};
