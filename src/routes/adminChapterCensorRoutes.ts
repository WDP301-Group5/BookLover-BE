import express from "express";
import {
  approveChapter,
  banChapter,
  getChapterCensorLog,
  getManagedChapters,
  getPendingChapters,
  rejectChapter,
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

export default adminChapterCensorRouter;
