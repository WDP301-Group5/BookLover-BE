import type { Request, Response } from "express";
import { io } from "../app.js";
import {
  ERR_BAD_REQUEST,
  ERR_INTERNAL_SERVER,
  ERR_NOT_FOUND,
} from "../consts/errorCode.js";
import { SUCCESS_OK } from "../consts/successCode.js";
import { Chapter } from "../models/Chapter.js";
import { OverrideFeedback } from "../models/OverrideFeedback.js";
import AdminChapterCensorService from "../services/AdminChapterCensorService.js";
import AIAnalysisService from "../services/aiAnalysisService.js";
import notificationService from "../services/notificationService.js";

export const getPendingChapters = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const chapters = await AdminChapterCensorService.getPendingChapters();

    const chaptersWithAI = await Promise.all(
      chapters.map(async (chapter: any) => {
        const aiAnalysis = await AIAnalysisService.getAnalysisByChapterId(
          chapter._id.toString(),
        );
        return {
          ...chapter,
          aiAnalysis: aiAnalysis || null,
        };
      }),
    );

    res.status(SUCCESS_OK).json({ success: true, data: chaptersWithAI });
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
  res: Response,
): Promise<void> => {
  try {
    const chapters = await AdminChapterCensorService.getManagedChapters();

    const chaptersWithAI = await Promise.all(
      chapters.map(async (chapter: any) => {
        const aiAnalysis = await AIAnalysisService.getAnalysisByChapterId(
          chapter._id.toString(),
        );
        return {
          ...chapter,
          aiAnalysis: aiAnalysis || null,
        };
      }),
    );

    res.status(SUCCESS_OK).json({ success: true, data: chaptersWithAI });
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
  res: Response,
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
  res: Response,
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
      reason,
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
  res: Response,
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
      reason,
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
  res: Response,
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
  res: Response,
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

export const overrideChapterDecision = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { decision, reason } = req.body;
    const adminId = req.user?.userId;

    if (!adminId) {
      res
        .status(ERR_BAD_REQUEST)
        .json({ success: false, message: "Admin ID is missing" });
      return;
    }

    if (!decision || !["active", "rejected"].includes(decision)) {
      res.status(ERR_BAD_REQUEST).json({
        success: false,
        message: "Decision must be 'active' or 'rejected'",
      });
      return;
    }

    if (!reason) {
      res.status(ERR_BAD_REQUEST).json({
        success: false,
        message: "Reason is required for override",
      });
      return;
    }

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      res.status(ERR_NOT_FOUND).json({
        success: false,
        message: "Chapter not found",
      });
      return;
    }

    const aiAnalysis = await AIAnalysisService.getAnalysisByChapterId(id);
    const originalDecision = aiAnalysis?.finalDecision || "flagged";

    const newStatus = decision === "active" ? "active" : "rejected";
    await Chapter.findByIdAndUpdate(id, { status: newStatus });

    await OverrideFeedback.create({
      chapterId: id,
      adminId,
      originalAIDecision: originalDecision,
      finalDecision: decision,
      adminReason: reason,
      overrideType:
        originalDecision === "safe"
          ? "reject_override"
          : originalDecision === "risky"
            ? "approve_override"
            : "approve_override",
    });

    const storyId = chapter.storyId.toString();
    if (decision === "active") {
      await notificationService.createNotification({
        to: storyId,
        type: "chapter_approved",
        title: "Chương được duyệt",
        content: `Chương "${chapter.title}" đã được duyệt bởi admin`,
      });
    } else {
      await notificationService.createNotification({
        to: storyId,
        type: "chapter_rejected",
        title: "Chương bị từ chối",
        content: `Chương "${chapter.title}" đã bị từ chối: ${reason}`,
      });
    }

    res.status(SUCCESS_OK).json({
      success: true,
      message: `Chapter ${decision === "active" ? "approved" : "rejected"} via override`,
    });
  } catch (error) {
    console.error("Error in overrideChapterDecision:", error);
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      message: `An error occurred while overriding chapter decision! ${error}`,
    });
  }
};

export const getQueueStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const ModerationQueueService = (
      await import("../services/moderationQueue.js")
    ).default;
    const status = await ModerationQueueService.getQueueStatus();
    res.status(SUCCESS_OK).json({ success: true, data: status });
  } catch (error) {
    console.error("Error in getQueueStatus:", error);
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      message: `An error occurred while fetching queue status! ${error}`,
    });
  }
};

export const retryFailedJobs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const ModerationQueueService = (
      await import("../services/moderationQueue.js")
    ).default;
    const count = await ModerationQueueService.retryFailed();
    res.status(SUCCESS_OK).json({
      success: true,
      message: `Retried ${count} failed jobs`,
      count,
    });
  } catch (error) {
    console.error("Error in retryFailedJobs:", error);
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      message: `An error occurred while retrying failed jobs! ${error}`,
    });
  }
};

export const getOverrideStatistics = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const total = await OverrideFeedback.countDocuments();

    const stats = await OverrideFeedback.aggregate([
      {
        $group: {
          _id: "$originalAIDecision",
          count: { $sum: 1 },
        },
      },
    ]);

    const byOverrideType = await OverrideFeedback.aggregate([
      {
        $group: {
          _id: "$overrideType",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(SUCCESS_OK).json({
      success: true,
      data: {
        total,
        byOriginalDecision: stats.reduce(
          (acc: any, s: any) => ({ ...acc, [s._id]: s.count }),
          {},
        ),
        byOverrideType: byOverrideType.reduce(
          (acc: any, s: any) => ({ ...acc, [s._id]: s.count }),
          {},
        ),
      },
    });
  } catch (error) {
    console.error("Error in getOverrideStatistics:", error);
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      message: `An error occurred while fetching override statistics! ${error}`,
    });
  }
};

export const triggerAIAnalysis = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      res.status(ERR_NOT_FOUND).json({
        success: false,
        message: "Chapter not found",
      });
      return;
    }

    const ModerationQueueService = (
      await import("../services/moderationQueue.js")
    ).default;
    const content = await ModerationQueueService.fetchChapterContentDirectly(
      chapter.contentURL,
    );

    const AIAnalysisService = (await import("../services/aiAnalysisService.js"))
      .default;
    const result = await AIAnalysisService.analyze(id, content);

    await Chapter.findByIdAndUpdate(id, { status: "pending" });

    io.emit("ai-analysis-complete", {
      chapterId: id,
      decision: result.decision,
      error: result.error,
    });

    if (result.error) {
      // If there's an error, don't return success - return error
      res.status(ERR_INTERNAL_SERVER).json({
        success: false,
        message: result.error,
      });
      return;
    }

    res.status(SUCCESS_OK).json({
      success: true,
      message: "Phân tích AI hoàn tất",
      data: {
        decision: result.decision,
      },
    });
  } catch (error) {
    console.error("Error in triggerAIAnalysis:", error);
    res.status(ERR_INTERNAL_SERVER).json({
      success: false,
      message: `An error occurred while triggering AI analysis! ${error}`,
    });
  }
};
