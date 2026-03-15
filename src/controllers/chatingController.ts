import { Request, Response } from "express";
import {
  ERR_BAD_REQUEST,
  ERR_INTERNAL_SERVER,
  ERR_UNAUTHORIZED,
} from "../consts/errorCode";
import ChatingService from "../services/ChatingService";
import { SUCCESS_OK } from "../consts/successCode";

export const getListChatingUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user ? req.user.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_UNAUTHORIZED)
        .json({ message: "Người dùng cần đăng nhập để lấy thông tin." });
    }
    const result = await ChatingService.getListChatingUser(userId);

    res.status(SUCCESS_OK).json(result);
  } catch (error) {
    res.status(ERR_INTERNAL_SERVER).json({
      message: "Có lỗi xảy ra khi lấy danh sách các người liên hệ",
      error: (error as Error).message,
    });
  }
};

export const getSearchChatingUser = async (req: Request, res: Response) => {
  const userId = req.user ? req.user.userId : undefined;
  if (!userId) {
    return res
      .status(ERR_UNAUTHORIZED)
      .json({ message: "Người dùng cần đăng nhập để lấy thông tin." });
  }
  const { keyword } = req.query;
  if (!keyword) {
    return res
      .status(ERR_BAD_REQUEST)
      .json({ message: "Không có thông tin để tìm kiếm" });
  }
  const result = await ChatingService.getSearchChatingUser(String(keyword));
  return res.status(SUCCESS_OK).json(result);
}

export const getChatingContent = async (req: Request, res: Response) => {
  try {
    const userId = req.user ? req.user.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_UNAUTHORIZED)
        .json({ message: "Người dùng cần đăng nhập để lấy thông tin." });
    }
    const { conversationId } = req.params;
    const { lastMessageTime, limit } = req.query;
    const result = await ChatingService.getChatingContent(
      conversationId,
      lastMessageTime ? new Date(Number(lastMessageTime)) : new Date(),
      limit ? parseInt(limit as string) : 20,
    );
    res.status(SUCCESS_OK).json(result);
  } catch (error) {
    res.status(ERR_INTERNAL_SERVER).json({
      message: "Có lỗi xảy ra khi lấy danh sách các người liên hệ",
      error: (error as Error).message,
    });
  }
};

export const checkAndCreateConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.user ? req.user.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_UNAUTHORIZED)
        .json({ message: "Người dùng cần đăng nhập để lấy thông tin." });
    }
    const memberId = req.params.memberId;
    const conversation = await ChatingService.checkAndCreateConversationExists(
      userId,
      memberId,
    );

    if (!conversation.success) {
      return res.status(ERR_BAD_REQUEST).json(conversation.error);
    }
    res.status(SUCCESS_OK).json(conversation.conversation);
  } catch (error) {
    res.status(ERR_INTERNAL_SERVER).json({
      message: "Có lỗi xảy ra khi kiểm tra hoặc tạo cuộc trò chuyện mới.",
      error: error,
    });
  }
};
