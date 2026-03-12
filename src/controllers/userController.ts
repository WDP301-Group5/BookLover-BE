import type { Request, Response } from "express";
import ReadingHistoryService from "../services/readingHistoryService.js";
import UserService from "../services/userService.js";
import { SUCCESS_OK } from "../consts/successCode.js";
import { ERR_BAD_REQUEST, ERR_INTERNAL_SERVER } from "../consts/errorCode.js";
import HistoryService from "../services/historyService.js";
import { changePassword } from "../services/authService.js";
import { z } from "zod";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

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

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
};

export const changePasswordController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Validate request body
    const validatedData = changePasswordSchema.parse(req.body);

    const result = await changePassword(
      userId,
      validatedData.currentPassword,
      validatedData.newPassword,
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.issues,
      });
    }

    if (error instanceof Error) {
      // Handle HTTP errors from authService
      if (error.message.includes("401")) {
        return res.status(401).json({
          success: false,
          message: "Mật khẩu hiện tại không chính xác.",
        });
      }
      if (error.message.includes("400")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes("404")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "An error occurred while changing password",
      error,
    });
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
    const currentUserId = req.user?.userId;
    const profileUserId = req.params.id;

    const author = await UserService.getPublicProfile(currentUserId, profileUserId);

    res.status(SUCCESS_OK).json({
      success: true,
      data: author,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching author profile",
    });
  }
};

export const toggleFollowProfile = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const targetUserId = req.params.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await UserService.toggleFollow(currentUserId, targetUserId);

    return res.status(200).json({
      success: true,
      message: result.status === "follow" ? "Followed successfully" : "Unfollowed successfully",
      data: result,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || "Error",
    });
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page as string) || 1;
    const currentUserId = req.user?.userId;

    const data = await UserService.getFollowers(userId, page, currentUserId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || "Error",
    });
  }
};

export const getFollowing = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page as string) || 1;
    const currentUserId = req.user?.userId;

    const data = await UserService.getFollowing(userId, page, currentUserId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || "Error",
    });
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
