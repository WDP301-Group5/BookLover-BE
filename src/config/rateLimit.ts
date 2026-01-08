import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";

export const apiRateLimit: RequestHandler = rateLimit({
	windowMs: 1 * 60 * 1000,
	max: 10,
	message: {
		status: 429,
		error: "Too many requests, please try again later.",
	},
	standardHeaders: true,
	legacyHeaders: false,
});
