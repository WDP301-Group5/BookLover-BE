import { Request, Response } from "express";
import { ERR_INTERNAL_SERVER, ERR_INVALID_TOKEN } from "../consts/errorCode";
import AuthorRevenueService from "../services/authorRevenueService";
import { SUCCESS_OK } from "../consts/successCode";
import WithdrawService from "../services/withdrawService";

export const getAuthorGeneralRevenueInfo = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user ? req.user.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_INVALID_TOKEN)
        .json({ message: "Thiếu thông tin người dùng" });
    }
    const data = await AuthorRevenueService.getAuthorGeneralRevenueInfo(userId);
    res.status(SUCCESS_OK).json(data);
  } catch (error) {
    return res.status(ERR_INTERNAL_SERVER).json({
      message: "Có lỗi xảy ra khi lấy thông tin doanh thu chung của tác giả.",
      error,
    });
  }
};

export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const userId = req.user ? req.user.userId : undefined;
    const { fromDate, toDate, page, limit, storyId } = req.query;
    if (!userId) {
      return res
        .status(ERR_INVALID_TOKEN)
        .json({ message: "Thiếu thông tin người dùng" });
    }
    const offset = (Number(page) - 1) * Number(limit);
    const data = await AuthorRevenueService.getAllTransactionForAuthor(
      userId,
      offset,
      Number(limit),
      storyId ? String(storyId) : undefined,
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
    );
    res.status(SUCCESS_OK).json(data);
  } catch (error) {
    return res.status(ERR_INTERNAL_SERVER).json({
      message: "Có lỗi xảy ra khi lấy danh sách giao dịch.",
      error,
    });
  }
};

export const getAllPremiumStorys = async (req: Request, res: Response) => {
  try {
    const userId = req.user ? req.user.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_INVALID_TOKEN)
        .json({ message: "Thiếu thông tin người dùng" });
    }
    const data = await AuthorRevenueService.getAllPremiumStorys(userId);
    res.status(SUCCESS_OK).json(data);
  } catch (error) {
    return res.status(ERR_INTERNAL_SERVER).json({
      message: "Có lỗi xảy ra khi lấy danh sách truyện premium.",
      error,
    });
  }
};

export const getWithdraws = async (req: Request, res: Response) => {
  try {
    const userId = req.user ? req.user.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_INVALID_TOKEN)
        .json({ message: "Thiếu thông tin người dùng" });
    }
    const { fromDate, toDate } = req.query;
    const data = await WithdrawService.getWithdraws(
      userId,
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
    );
    res.status(SUCCESS_OK).json(data);
  } catch (error) {
    return res.status(ERR_INTERNAL_SERVER).json({
      message: "Có lỗi xảy ra khi lấy danh sách truyện premium.",
      error,
    });
  }
};

export const createWithdraw = async (req: Request, res: Response) => {
  try {
    const userId = req.user ? req.user.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_INVALID_TOKEN)
        .json({ message: "Thiếu thông tin người dùng" });
    }
    const { phoneNumber, amount } = req.body;
    const data = await WithdrawService.createWithdraw(userId, phoneNumber, Number(amount));
    res.status(SUCCESS_OK).json(data);
  } catch (error) {
    return res.status(ERR_INTERNAL_SERVER).json({
      message: "Có lỗi xảy ra khi tạo truyện.",
      error,
    });
  }
};
