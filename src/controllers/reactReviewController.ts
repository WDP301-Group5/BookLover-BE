import type { Request, Response } from "express";
import ReactReviewService from "../services/reactReviewService";

export const getUserReactReviews = async (req: Request, res: Response) => {
	try {
		const userId = (req as any)?.user?.userId;
		if (!userId) {
			return res.status(400).json({ message: "Không có thông tin người dùng" });
		}

		const reviewIds =
			typeof req.query.reviewIds === "string"
				? req.query.reviewIds.split(",")
				: [];

		if (!reviewIds.length) {
			return res.status(400).json({ message: "Không có thông tin review" });
		}

		const result = await ReactReviewService.getUserReactReviews(
			userId,
			reviewIds,
		);

		return res.status(200).json(result);
	} catch (error: any) {
		return res.status(500).json({
			message: error.message || "Có lỗi xảy ra khi lấy react review",
		});
	}
};

export const userReactReview = async (req: Request, res: Response) => {
	try {
		const userId = (req as any)?.user?.userId;
		if (!userId) {
			return res.status(400).json({ message: "Không có thông tin người dùng" });
		}

		const reviewId = req.params.reviewId;
		if (!reviewId) {
			return res.status(400).json({ message: "Không có thông tin review" });
		}

		const { react } = req.body;

		const result = await ReactReviewService.userReactReview(
			userId,
			reviewId,
			react,
		);

		return res.status(200).json(result);
	} catch (error: any) {
		return res.status(500).json({
			message: error.message || "Có lỗi xảy ra khi người dùng react review",
		});
	}
};
