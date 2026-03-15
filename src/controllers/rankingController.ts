import type { Request, Response } from "express";
import rankingService from "../services/rankingService";

export const getTopStories = async (req: Request, res: Response) => {
  try {
    const result = await rankingService.getTopStories({
      type: req.query.type as "views" | "followers" | undefined,
      limit: Number(req.query.limit || 15),
    });

    return res.status(200).json({
      message: "Get top stories ranking successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const getTopAuthors = async (req: Request, res: Response) => {
  try {
    const result = await rankingService.getTopAuthors({
      type: req.query.type as "followers" | "stories" | undefined,
      limit: Number(req.query.limit || 30),
    });

    return res.status(200).json({
      message: "Get top authors ranking successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const getTopUsers = async (req: Request, res: Response) => {
  try {
    const result = await rankingService.getTopUsers({
      type: req.query.type as "comments" | "spent" | undefined,
      limit: Number(req.query.limit || 30),
    });

    return res.status(200).json({
      message: "Get top users ranking successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};