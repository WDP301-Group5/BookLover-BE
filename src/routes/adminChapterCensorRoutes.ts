import express from "express";
import {
	approveChapter,
	banChapter,
	getChapterCensorLog,
	getManagedChapters,
	getOverrideStatistics,
	getPendingChapters,
	getQueueStatus,
	overrideChapterDecision,
	rejectChapter,
	retryFailedJobs,
	triggerAIAnalysis,
	unbanChapter,
} from "../controllers/AdminChapterCensorController.js";

const adminChapterCensorRouter = express.Router();

adminChapterCensorRouter.get("/pending", getPendingChapters);
adminChapterCensorRouter.get("/managed", getManagedChapters);
adminChapterCensorRouter.post("/:id/approve", approveChapter);
adminChapterCensorRouter.post("/:id/reject", rejectChapter);
adminChapterCensorRouter.post("/:id/ban", banChapter);
adminChapterCensorRouter.post("/:id/unban", unbanChapter);
adminChapterCensorRouter.get("/:id/logs", getChapterCensorLog);
adminChapterCensorRouter.post("/:id/override", overrideChapterDecision);
adminChapterCensorRouter.post("/:id/trigger-ai", triggerAIAnalysis);
adminChapterCensorRouter.get("/queue/status", getQueueStatus);
adminChapterCensorRouter.post("/queue/retry", retryFailedJobs);
adminChapterCensorRouter.get("/statistics/overrides", getOverrideStatistics);

export default adminChapterCensorRouter;
