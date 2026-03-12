import type { Request, Response } from "express";
import ReadingHistoryService from "../services/readingHistoryService.js";
import UserService from "../services/userService.js";
import { SUCCESS_OK } from "../consts/successCode.js";
import { ERR_BAD_REQUEST, ERR_INTERNAL_SERVER } from "../consts/errorCode.js";
import HistoryService from "../services/historyService.js";

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await UserService.getAllUsers();
    res.status(SUCCESS_OK).json({
      success: true,
      message: "Get all users successfully!",
      data: users,
    });
  } catch (error) {
    return res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      error: `An error occured during getting all users! ${error}.`,
    });
  }
};

export const getLast3History = async (req: Request, res: Response) => {
  try {
    const userId = req.user ? req.user.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_BAD_REQUEST)
        .json({ message: "Không có thông tin người dùng" });
    }
    const history = await ReadingHistoryService.getLast3History(
      userId as string,
    );
    res.status(SUCCESS_OK).json({
      success: true,
      message: "Get last 3 history successfully!",
      data: history,
    });
  } catch (error) {
    return res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      error: `An error occured during getting last 3 history! ${error}.`,
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await UserService.getProfile(userId);

    res.status(SUCCESS_OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(ERR_INTERNAL_SERVER).json({ success: false, error });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const updated = await UserService.updateProfile(userId, req.body);

    res.status(SUCCESS_OK).json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(ERR_INTERNAL_SERVER).json({ success: false, error });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        success: false,
        message: "Query is required",
      });
    }

    const users = await UserService.searchUsers(q);

    res.status(SUCCESS_OK).json({
      success: true,
      message: "Search users successfully",
      data: users,
    });
  } catch (error) {
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      error: `Error searching users: ${error}`,
    });
  }
};

export const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const author = await UserService.getPublicProfile(userId);

    res.status(SUCCESS_OK).json({
      success: true,
      data: author,
    });
  } catch (error) {
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      error: `Error fetching author profile: ${error}`,
    });
  }
};

export const followAuthor = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId; // từ verifyToken
    const { authorId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!authorId) {
      return res
        .status(400)
        .json({ success: false, message: "authorId is required" });
    }

    const result = await UserService.toggleFollow(userId, authorId);

    res.status(SUCCESS_OK).json({
      success: true,
      message: `Successfully ${result.status === "follow" ? "followed" : "unfollowed"} author`,
      data: result,
    });
  } catch (error) {
    res
      .status(ERR_INTERNAL_SERVER)
      .json({ success: false, error: `Error following author: ${error}` });
  }
};

export const getReadingHistory = async (req: Request, res: Response) => {
  try {
    const userId = req?.user ? req.user.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_BAD_REQUEST)
        .json({ success: false, message: "Không có thông tin người dùng" });
    }
    const { page, limit } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const history = await ReadingHistoryService.getReadingHistory(
      userId,
      offset,
      Number(limit),
    );
    res.status(SUCCESS_OK).json({ success: true, data: history });
  } catch (error) {
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      error: `Error getting reading history: ${error}`,
    });
  }
};

export const getCommentHistory = async (req: Request, res: Response) => {
  try {
    const userId = req?.user ? req.user.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_BAD_REQUEST)
        .json({ success: false, message: "Không có thông tin người dùng" });
    }
    const { page, limit } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const history = await HistoryService.getCommentHistory(
      userId,
      offset,
      Number(limit),
    );
    res.status(SUCCESS_OK).json({ success: true, data: history });
  } catch (error) {
	console.log("============", error)
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      error: `Error getting comment history: ${error}`,
    });
  }
};

export const getReviewHistory = async (req: Request, res: Response) => {
  try {
    const userId = req?.user ? req.user.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_BAD_REQUEST)
        .json({ success: false, message: "Không có thông tin người dùng" });
    }
    const { page, limit } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const history = await HistoryService.getReviewHistory(
      userId,
      offset,
      Number(limit),
    );
    res.status(SUCCESS_OK).json({ success: true, data: history });
  } catch (error) {
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      error: `Error getting review history: ${error}`,
    });
  }
};

export const getRechargeHistory = async (req: Request, res: Response) => {
  try {
    const userId = req?.user ? req.user.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_BAD_REQUEST)
        .json({ success: false, message: "Không có thông tin người dùng" });
    }
    const { page, limit } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const history = await HistoryService.getRechargeHistory(
      userId,
      offset,
      Number(limit),
    );
    res.status(SUCCESS_OK).json({ success: true, data: history });
  } catch (error) {
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      error: `Error getting recharge history: ${error}`,
    });
  }
};

export const getPurchaseHistory = async (req: Request, res: Response) => {
  try {
    const userId = req?.user ? req.user.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_BAD_REQUEST)
        .json({ success: false, message: "Không có thông tin người dùng" });
    }
    const { page, limit } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const history = await HistoryService.getPurchaseHistory(
      userId,
      offset,
      Number(limit),
    );
    res.status(SUCCESS_OK).json({ success: true, data: history });
  } catch (error) {
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      error: `Error getting purchase history: ${error}`,
    });
  }
};
