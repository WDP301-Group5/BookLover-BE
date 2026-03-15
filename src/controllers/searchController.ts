import type { Request, Response } from "express";
import searchService from "../services/searchService";

export const searchStories = async (req: Request, res: Response) => {
  try {
    const result = await searchService.searchStories({
      q: String(req.query.q || ""),
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 10),
      status: String(req.query.status || ""),
      category: String(req.query.category || ""),
      sortBy: String(req.query.sortBy || "Ngày cập nhật"),
    });

    return res.status(200).json({
      message: "Search stories successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const searchProfiles = async (req: Request, res: Response) => {
  try {
    const result = await searchService.searchProfiles({
      q: String(req.query.q || ""),
      limit: Number(req.query.limit || 20),
    });

    return res.status(200).json({
      message: "Search profiles successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};