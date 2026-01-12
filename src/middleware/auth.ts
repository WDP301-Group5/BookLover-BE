import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ERR_INVALID_TOKEN } from "../consts/errorCode.js";
import type { JwtPayload } from "../interfaces/jwtPayload.js";

/**
 * Middleware bảo vệ route cần Access Token
 */
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

		(req as Request & { user?: JwtPayload }).user = decoded;
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
