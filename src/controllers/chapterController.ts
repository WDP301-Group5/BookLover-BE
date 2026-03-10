// src/controllers/chapterPageController.ts

import axios from "axios";
import type { Request, Response } from "express";
import {
  ERR_BAD_REQUEST,
  ERR_FORBIDDEN,
  ERR_INTERNAL_SERVER,
  ERR_PAYMENT_REQUIRED,
  ERR_UNAUTHORIZED,
} from "../consts/errorCode";
import { SUCCESS_OK } from "../consts/successCode";
import * as chapterService from "../services/chapterService";
import StoryService from "../services/storyService";
import TransactionService from "../services/transactionService";
import UserService from "../services/userService";
import { en } from "zod/locales";

export const createChapter = async (req: Request, res: Response) =>
  res.json(await chapterService.createChapter(req.body));

export const getChaptersByStory = async (req: Request, res: Response) => {
  try {
    const chapters = await chapterService.getChaptersByStory(
      req.params.storyId,
    );
    return res.status(SUCCESS_OK).json(chapters);
  } catch (error: unknown) {
    return res.status(ERR_INTERNAL_SERVER).json({
      message: `Có lỗi xảy ra khi lấy danh sách chương: ${(error as Error).message}`,
    });
  }
};

export const getChapterByChapterNumber = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user ? req.user.userId : undefined;
  try {
    const storyId = await StoryService.getStoryIdBySlug(req.params.storySlug);
    const chapter = await chapterService.getChapterByChapterNumber(
      storyId,
      Number(req.params.chapterNumber),
    );
    if (!chapter) {
      return res.status(SUCCESS_OK).json({ message: "Chương không tồn tại" });
    }
    chapter.id = chapter._id.toString();
    if (chapter.isPremium && chapter.price > 0) {
      if (!userId) {
        chapter.contentURL = "status-require-login";
        return res.status(SUCCESS_OK).json(chapter);
      } else {
        const hasPurchased = await TransactionService.checkUserPurchasedChapter(
          userId,
          chapter.id,
        );
        if (!hasPurchased) {
          chapter.contentURL = "status-buy-chapter";
          return res.status(SUCCESS_OK).json(chapter);
        }
      }
    }
    const text = await axios
      .get(chapter.contentURL, { responseType: "text" })
      .then((res) => res.data)
      .catch((err) => {
        console.log("Error when get text from cloudinary", err);
      });
    chapter.contentURL = text;
    return res.status(SUCCESS_OK).json(chapter);
  } catch (error: unknown) {
    return res.status(ERR_INTERNAL_SERVER).json({
      message: `Có lỗi xảy ra khi lấy thông tin chương: ${(error as Error).message}`,
    });
  }
};

export const updateChapter = async (req: Request, res: Response) =>
  res.json(await chapterService.updateChapter(req.params.id, req.body));

export const deleteChapter = async (req: Request, res: Response) =>
  res.json(await chapterService.deleteChapter(req.params.id));

export const getChapterById = async (req: Request, res: Response) =>
  res.json(await chapterService.getChapterById(req.params.id));

export const testFileUpload = async (req: Request, res: Response) => {
  try {
    if (!req.body.file) {
      console.log("=============> ko có file");
      return res
        .status(400)
        .json({ message: "Chưa có file nào được gửi lên." });
    }
    console.log("File đã được upload thành công:", req.body.file);
    res.json({
      message: "File đã được upload thành công",
      file: req.body.file,
    });
  } catch (_error) {
    return res.status(500).json({ message: "Có lỗi xảy ra khi upload file." });
  }
};

export const buyChapter = async (req: Request, res: Response) => {
  const userId = req.user ? req.user.userId : undefined;
  const { currentStone } = req.body;
  if (!userId) {
    return res
      .status(ERR_UNAUTHORIZED)
      .json({ message: "Người dùng chưa đăng nhập." });
  }
  if (!currentStone || isNaN(currentStone) || currentStone < 0) {
    return res.status(ERR_UNAUTHORIZED).json({
      message: "Thông tin linh thạch của người dùng không chính xác.",
    });
  }
  const chapterId = req.params.chapterId;
  if (!chapterId) {
    return res
      .status(ERR_BAD_REQUEST)
      .json({ message: "Không có thông tin chương" });
  }
  try {
    const stone = await UserService.checkUserStone(userId);
    if (!stone || stone !== currentStone) {
      return res
        .status(ERR_UNAUTHORIZED)
        .json({ message: "Thông tin lịch thạch của người dùng không đúng." });
    }
    const result = await TransactionService.userBuyChapter(
      userId,
      chapterId,
      stone,
    );
    if (!result.success) {
      let message = "Có lỗi xảy ra khi tạo giao dịch mua chương.";
      if (!result.enough) {
        message = "Linh thạch người dùng không đủ.";
      }
      return res.status(ERR_PAYMENT_REQUIRED).json({
        success: false,
        enough: result.enough,
        message,
      });
    }
    return res
      .status(SUCCESS_OK)
      .json({
        success: true,
        message: "Mua chương thành công.",
        enough: result.enough,
      });
  } catch (error: unknown) {
    return res.status(ERR_INTERNAL_SERVER).json({
      message: `Có lỗi xảy ra khi mua chương: ${(error as Error).message}`,
    });
  }
};
