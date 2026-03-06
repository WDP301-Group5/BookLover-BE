import express from "express";
import {
  approveStory,
  banStory,
  getManagedStories,
  getPendingStories,
  getStoryCensorLog,
  rejectStory,
  unbanStory,
} from "../controllers/adminStoryCensorController.js";

const adminStoryCensorRouter = express.Router();

adminStoryCensorRouter.get("/pending", getPendingStories);
adminStoryCensorRouter.get("/managed", getManagedStories);
adminStoryCensorRouter.post("/:id/approve", approveStory);
adminStoryCensorRouter.post("/:id/reject", rejectStory);
adminStoryCensorRouter.post("/:id/ban", banStory);
adminStoryCensorRouter.post("/:id/unban", unbanStory);
adminStoryCensorRouter.get("/:id/logs", getStoryCensorLog);

export default adminStoryCensorRouter;
