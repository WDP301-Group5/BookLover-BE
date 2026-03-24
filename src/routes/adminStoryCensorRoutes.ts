import express from "express";
import {
  analyzeStory,
  approveStory,
  banStory,
  getManagedStories,
  getPendingStories,
  getStoryAIAnalysis,
  getStoryCensorLog,
  getStoryChapters,
  rejectStory,
  unbanStory,
} from "../controllers/adminStoryCensorController.js";

const adminStoryCensorRouter = express.Router();

adminStoryCensorRouter.get("/pending", getPendingStories);
adminStoryCensorRouter.get("/managed", getManagedStories);
adminStoryCensorRouter.get("/:id/chapters", getStoryChapters);
adminStoryCensorRouter.post("/:id/approve", approveStory);
adminStoryCensorRouter.post("/:id/reject", rejectStory);
adminStoryCensorRouter.post("/:id/ban", banStory);
adminStoryCensorRouter.post("/:id/unban", unbanStory);
adminStoryCensorRouter.get("/:id/logs", getStoryCensorLog);
adminStoryCensorRouter.post("/:id/analyze", analyzeStory);
adminStoryCensorRouter.get("/:id/ai-analysis", getStoryAIAnalysis);

export default adminStoryCensorRouter;
