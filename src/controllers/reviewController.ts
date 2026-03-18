// src/controllers/reviewController.ts
import type { Request, Response } from "express";
import reviewService from "../services/reviewService";

export const getReviewStories = async (req: Request, res: Response) => {
  try {
    const result = await reviewService.getReviewStories({
      search: String(req.query.search || ""),
      limit: Number(req.query.limit || 50),
    });

    return res.status(200).json({
      message: "Get review stories successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const getReviews = async (req: Request, res: Response) => {
  try {
    const result = await reviewService.getReviews({
      sort: req.query.sort as "newest" | "oldest" | undefined,
      genre: String(req.query.genre || ""),
      search: String(req.query.search || ""),
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
    });

    return res.status(200).json({
      message: "Get reviews successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any)?.user?.userId;
    const { storyId, content } = req.body;

    const result = await reviewService.createReview({
      userId,
      storyId,
      content,
    });

    return res.status(201).json({
      message: "Tạo review thành công",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Internal server error",
    });
  }
};