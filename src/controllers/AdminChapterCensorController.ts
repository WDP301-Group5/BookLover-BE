import type { Request, Response } from "express";
import {
  ERR_BAD_REQUEST,
  ERR_INTERNAL_SERVER,
  ERR_NOT_FOUND,
} from "../consts/errorCode.js";
import { SUCCESS_OK } from "../consts/successCode.js";
import AdminChapterCensorService from "../services/AdminChapterCensorService.js";

export const getPendingChapters = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const chapters = await AdminChapterCensorService.getPendingChapters();
    res.status(SUCCESS_OK).json({ success: true, data: chapters });
  } catch (error) {
    console.error("Error in getPendingChapters:", error);
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      message: `An error occurred while fetching pending chapters! ${error}`,
    });
  }
};

export const getManagedChapters = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const chapters = await AdminChapterCensorService.getManagedChapters();
    res.status(SUCCESS_OK).json({ success: true, data: chapters });
  } catch (error) {
    console.error("Error in getManagedChapters:", error);
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      message: `An error occurred while fetching managed chapters! ${error}`,
    });
  }
};

export const approveChapter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user?.userId;

    if (!adminId) {
      res
        .status(ERR_BAD_REQUEST)
        .json({ success: false, message: "Admin ID is missing" });
      return;
    }

    const chapter = await AdminChapterCensorService.approveChapter(id, adminId);
    if (!chapter) {
      res
        .status(ERR_NOT_FOUND)
        .json({ success: false, message: "Pending chapter not found" });
      return;
    }

    res.status(SUCCESS_OK).json({
      success: true,
      message: "Chapter approved successfully",
      data: chapter,
    });
  } catch (error) {
    console.error("Error in approveChapter:", error);
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      message: `An error occurred while approving chapter! ${error}`,
    });
  }
};

export const rejectChapter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.userId;

    if (!adminId) {
      res
        .status(ERR_BAD_REQUEST)
        .json({ success: false, message: "Admin ID is missing" });
      return;
    }

    if (!reason) {
      res.status(ERR_BAD_REQUEST).json({
        success: false,
        message: "Reason is required to reject a chapter",
      });
      return;
    }

    const chapter = await AdminChapterCensorService.rejectChapter(
      id,
      adminId,
      reason
    );
    if (!chapter) {
      res
        .status(ERR_NOT_FOUND)
        .json({ success: false, message: "Pending chapter not found" });
      return;
    }

    res.status(SUCCESS_OK).json({
      success: true,
      message: "Chapter rejected successfully",
      data: chapter,
    });
  } catch (error) {
    console.error("Error in rejectChapter:", error);
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      message: `An error occurred while rejecting chapter! ${error}`,
    });
  }
};

export const banChapter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.userId;

    if (!adminId) {
      res
        .status(ERR_BAD_REQUEST)
        .json({ success: false, message: "Admin ID is missing" });
      return;
    }

    if (!reason) {
      res.status(ERR_BAD_REQUEST).json({
        success: false,
        message: "Reason is required to ban a chapter",
      });
      return;
    }

    const chapter = await AdminChapterCensorService.banChapter(
      id,
      adminId,
      reason
    );
    if (!chapter) {
      res
        .status(ERR_NOT_FOUND)
        .json({ success: false, message: "Active chapter not found" });
      return;
    }

    res.status(SUCCESS_OK).json({
      success: true,
      message: "Chapter banned successfully",
      data: chapter,
    });
  } catch (error) {
    console.error("Error in banChapter:", error);
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      message: `An error occurred while banning chapter! ${error}`,
    });
  }
};

export const unbanChapter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user?.userId;

    if (!adminId) {
      res
        .status(ERR_BAD_REQUEST)
        .json({ success: false, message: "Admin ID is missing" });
      return;
    }

    const chapter = await AdminChapterCensorService.unbanChapter(id, adminId);
    if (!chapter) {
      res
        .status(ERR_NOT_FOUND)
        .json({ success: false, message: "Banned chapter not found" });
      return;
    }

    res.status(SUCCESS_OK).json({
      success: true,
      message: "Chapter unbanned successfully",
      data: chapter,
    });
  } catch (error) {
    console.error("Error in unbanChapter:", error);
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      message: `An error occurred while unbanning chapter! ${error}`,
    });
  }
};

export const getChapterCensorLog = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const logs = await AdminChapterCensorService.getChapterCensorLog(id);
    res.status(SUCCESS_OK).json({ success: true, data: logs });
  } catch (error) {
    console.error("Error in getChapterCensorLog:", error);
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      message: `An error occurred while fetching chapter censor logs! ${error}`,
    });
  }
};
