// src/routes/chapterPage.ts
import { Router } from "express";
import * as chapterController from "../controllers/chapterController";
import { checkToken, verifyToken } from "../middleware/auth";
import { uploadTextFile, uploadMultipleTextFiles } from "../middleware/upload";

const chapterRouter = Router();

chapterRouter.post(
  "/testfile",
  uploadTextFile,
  chapterController.testFileUpload,
);
chapterRouter.post("/buy/:chapterId", checkToken, chapterController.buyChapter);

// Single chapter creation
chapterRouter.post(
  "/",
  verifyToken,
  uploadTextFile,
  chapterController.createChapter,
);

// Batch chapters creation - must come BEFORE generic routes
chapterRouter.post(
  "/batch",
  verifyToken,
  uploadMultipleTextFiles,
  chapterController.createChaptersBatch,
);

// Route order matters - more specific routes must come BEFORE generic ones
chapterRouter.get(
  "/story/:storySlug/chapter/:chapterNumber",
  checkToken,
  chapterController.getChapterByChapterNumber,
);
chapterRouter.get("/story/:storyId", chapterController.getChaptersByStory);
chapterRouter.get("/:id", chapterController.getChapterById);
chapterRouter.put(
  "/:id",
  verifyToken,
  uploadTextFile,
  chapterController.updateChapter,
);
chapterRouter.delete("/:id", verifyToken, chapterController.deleteChapter);

export default chapterRouter;
