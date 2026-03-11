import type { Request, Response } from "express";
import { ERR_BAD_REQUEST, ERR_INTERNAL_SERVER } from "../consts/errorCode";
import { SUCCESS_CREATED } from "./../consts/successCode";
import ReadingHistoryService from "../services/readingHistoryService";

export const addNewReadingHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query as { userId: string };
    const { storyId, chapterNumber } = req.body;
    const newHistory = await ReadingHistoryService.addNewReadingHistory(
      userId,
      storyId,
      Number(chapterNumber),
    );
    return res.status(SUCCESS_CREATED).json({
      success: true,
      message: "Thêm lịch sử truyện thành công",
      data: newHistory,
    });
  } catch (error) {
    return res
      .status(ERR_INTERNAL_SERVER)
      .json({ message: "Có lỗi xảy ra khi thêm lịch sử truyện", error: error });
  }
};

export const deleteHistory = async (req: Request, res: Response) => {
  try {
    const userId = req?.user ? req.user.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_BAD_REQUEST)
        .json({ message: "Không có thông tin người dùng." });
    }
	const historyId = req.params.historyId;
	if (!historyId) {
		return res
			.status(ERR_BAD_REQUEST)
			.json({ message: "Không có thông tin lịch sử truyện" });
	}
    await ReadingHistoryService.deleteHistory(userId, historyId);
    return res.status(SUCCESS_CREATED).json({ success: true, message: "Xóa lịch sử truyện thành công." });
  } catch (error) {
    return res
      .status(ERR_INTERNAL_SERVER)
      .json({ message: "Có lỗi xảy ra khi xoa lịch sử truyện", error: error });
  }
};
