// src/controllers/chapterPageController.ts

import axios from "axios";
import type { Request, Response } from "express";
import { z } from "zod";
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

const createChapterSchema = z.object({
  storyId: z.string().min(1, "Story ID là bắt buộc"),
  chapterNumber: z.union([z.string(), z.number()]).refine((val) => {
    const num = typeof val === "string" ? parseInt(val, 10) : val;
    return Number.isInteger(num) && num >= 1;
  }, "Số chương phải là số nguyên dương (>= 1)"),
  title: z.string().min(1, "Tiêu đề chương là bắt buộc"),
  chapterType: z.enum(["free", "vip"]).optional(),
  price: z
    .union([z.string(), z.number()])
    .optional()
    .refine((val) => {
      if (!val) return true;
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      return Number.isInteger(num) && num >= 1;
    }, "Giá chương phải là số nguyên dương (>= 1)"),
});

const createChaptersBatchSchema = z.object({
  storyId: z.string().min(1, "Story ID là bắt buộc"),
  chapters: z.array(
    z.object({
      chapterNumber: z.union([z.string(), z.number()]).refine((val) => {
        const num = typeof val === "string" ? parseInt(val, 10) : val;
        return Number.isInteger(num) && num >= 1;
      }, "Số chương phải là số nguyên dương (>= 1)"),
      title: z.string().min(1, "Tiêu đề chương là bắt buộc"),
      chapterType: z.enum(["free", "vip"]).optional(),
      price: z
        .union([z.string(), z.number()])
        .optional()
        .refine((val) => {
          if (!val) return true;
          const num = typeof val === "string" ? parseInt(val, 10) : val;
          return Number.isInteger(num) && num >= 1;
        }, "Giá chương phải là số nguyên dương (>= 1)"),
      fileIndex: z.number().int().min(0).optional(),
    }),
  ),
});

export const createChapter = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = createChapterSchema.parse(req.body);

    // Convert chapterNumber and price to integers
    const chapterNumber = parseInt(String(validatedData.chapterNumber), 10);
    const price = validatedData.price
      ? parseInt(String(validatedData.price), 10)
      : undefined;

    const chapterData = {
      ...req.body,
      chapterNumber,
      ...(price !== undefined && { price }),
    };

    const result = await chapterService.createChapter(chapterData);
    return res.json(result);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(ERR_BAD_REQUEST).json({
        error: "Dữ liệu chương không hợp lệ",
        details: error.issues,
      });
    }
    return res.status(ERR_INTERNAL_SERVER).json({
      error: "Lỗi tạo chương",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createChaptersBatch = async (req: Request, res: Response) => {
  try {
    console.log("=== CREATE CHAPTERS BATCH START ===");
    console.log("Request body chapters:", req.body.chapters);

    // Parse chapters JSON string from FormData
    let chaptersData = req.body.chapters;
    if (typeof chaptersData === "string") {
      try {
        chaptersData = JSON.parse(chaptersData);
      } catch (e) {
        return res.status(ERR_BAD_REQUEST).json({
          error: "Không thể parse dữ liệu chapters",
          message: "chapters phải là JSON string hợp lệ",
        });
      }
    }

    // Validate request body
    const validatedData = createChaptersBatchSchema.parse({
      storyId: req.body.storyId,
      chapters: chaptersData,
    });

    // Get uploaded files from middleware
    const uploadedFiles = req.body.uploadedFiles || [];

    console.log("Uploaded files count:", uploadedFiles.length);
    console.log("Validated chapters count:", validatedData.chapters.length);

    if (uploadedFiles.length === 0) {
      return res.status(ERR_BAD_REQUEST).json({
        error: "Chưa có file được upload",
      });
    }

    if (uploadedFiles.length !== validatedData.chapters.length) {
      return res.status(ERR_BAD_REQUEST).json({
        error: `Số lượng file (${uploadedFiles.length}) không khớp với số lượng chương (${validatedData.chapters.length})`,
      });
    }

    // Map uploaded files with chapter info
    const chaptersToCreate = validatedData.chapters.map((chapter, index) => {
      const chapterNumber = parseInt(String(chapter.chapterNumber), 10);
      const price = chapter.price
        ? parseInt(String(chapter.price), 10)
        : undefined;

      // Determine which file to use: by fileIndex if provided, otherwise use sequential index (for backwards compatibility)
      const fileIndex =
        chapter.fileIndex !== undefined ? chapter.fileIndex : index;
      if (fileIndex >= uploadedFiles.length) {
        throw new Error(
          `File index ${fileIndex} out of bounds. Total files: ${uploadedFiles.length}`,
        );
      }

      return {
        storyId: validatedData.storyId,
        chapterNumber,
        title: chapter.title,
        contentURL: uploadedFiles[fileIndex].contentURL,
        isPremium: chapter.chapterType === "vip",
        ...(price !== undefined && { price }),
        status: "pending",
      };
    });

    console.log("Chapters to create:", chaptersToCreate);

    // Create all chapters using batch insert
    const result = await chapterService.createChaptersBatch(chaptersToCreate);

    console.log("Batch creation result:", result);

    return res.status(SUCCESS_OK).json(result);
  } catch (error: unknown) {
    console.error("Batch creation error:", error);

    if (error instanceof z.ZodError) {
      return res.status(ERR_BAD_REQUEST).json({
        error: "Dữ liệu chương không hợp lệ",
        details: error.issues,
      });
    }

    return res.status(ERR_INTERNAL_SERVER).json({
      error: "Lỗi tạo batch chương",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getChaptersByStory = async (req: Request, res: Response) => {
  try {
    const chapters = await chapterService.getChaptersByStory(
      req.params.storyId as string,
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
    const storyId = await StoryService.getStoryIdBySlug(
      req.params.storySlug as string,
    );
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

export const updateChapter = async (req: Request, res: Response) => {
  try {
    const updateData = { ...req.body };
    if (req.body.contentURL) {
      updateData.contentURL = req.body.contentURL;
    }
    if (updateData.chapterType) {
      updateData.isPremium = updateData.chapterType === "vip";
    }
    const result = await chapterService.updateChapter(
      req.params.id as string,
      updateData,
    );
    return res.status(SUCCESS_OK).json(result);
  } catch (error: unknown) {
    return res.status(ERR_INTERNAL_SERVER).json({
      error: "Lỗi cập nhật chương",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteChapter = async (req: Request, res: Response) =>
  res.json(await chapterService.deleteChapter(req.params.id as string));

export const getChapterById = async (req: Request, res: Response) => {
  try {
    const chapter = await chapterService.getChapterById(
      req.params.id as string,
    );
    if (!chapter) {
      return res
        .status(ERR_BAD_REQUEST)
        .json({ message: "Chương không tồn tại" });
    }
    // Fetch content from Cloudinary URL for author editing
    if (chapter.contentURL && !chapter.contentURL.startsWith("status-")) {
      try {
        const text = await axios
          .get(chapter.contentURL, { responseType: "text" })
          .then((r) => r.data);
        chapter.contentURL = text;
      } catch (_err) {
        // Keep the URL as-is if fetch fails
      }
    }
    return res.status(SUCCESS_OK).json(chapter);
  } catch (error: unknown) {
    return res.status(ERR_INTERNAL_SERVER).json({
      message: `Có lỗi xảy ra khi lấy thông tin chương: ${(error as Error).message}`,
    });
  }
};

export const getChaptersByStoryForAuthor = async (
  req: Request,
  res: Response,
) => {
  try {
    const chapters = await chapterService.getChaptersByStoryForAuthor(
      req.params.storyId as string,
    );
    return res.status(SUCCESS_OK).json(chapters);
  } catch (error: unknown) {
    return res.status(ERR_INTERNAL_SERVER).json({
      message: `Có lỗi xảy ra khi lấy danh sách chương: ${(error as Error).message}`,
    });
  }
};

export const publishStoryChapters = async (req: Request, res: Response) => {
  try {
    const result = await chapterService.updateChapterStatusByStory(
      req.params.storyId as string,
      "draft",
      "pending",
    );
    return res.status(SUCCESS_OK).json({
      success: true,
      message: `Đã chuyển ${result.modifiedCount} chương sang trạng thái chờ duyệt`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error: unknown) {
    return res.status(ERR_INTERNAL_SERVER).json({
      error: "Lỗi xuất bản chương",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

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
  const chapterId = req.params.chapterId as string;
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
    return res.status(SUCCESS_OK).json({
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
