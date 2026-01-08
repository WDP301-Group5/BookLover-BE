import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
	id?: string;
	username?: string;
	role?: string;
	iat?: number;
	exp?: number;
}

/**
 * Middleware bảo vệ route cần Access Token
 */
export const verifyToken = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const header = req.headers.authorization;
	console.log("header", header);
	if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
		res.status(401).json({ message: "Missing token" });
		return;
	}

	const token = header.split(" ")[1];
	try {
		const decoded = jwt.verify(
			token,
			process.env.JWT_ACCESS_SECRET ?? "access_secret",
		) as JwtPayload;
		(req as Request & { user?: JwtPayload }).user = decoded; // { id, username, role }
		next();
	} catch (err: unknown) {
		if ((err as Error)?.name === "TokenExpiredError") {
			console.log("Token đã hết hạn");
			res.status(401).json({ message: "Token đã hết hạn" });
		} else {
			console.log("Token không hợp lệ:", (err as Error)?.message ?? err);
			res.status(403).json({ message: "Token không hợp lệ" });
		}
	}
};
