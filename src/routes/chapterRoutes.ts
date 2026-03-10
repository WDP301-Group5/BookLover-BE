// src/routes/chapterPage.ts
import { Router } from "express";
import * as chapterController from "../controllers/chapterController";
import { checkToken, verifyToken } from "../middleware/auth";
import { uploadTextFile } from "../middleware/upload";

const chapterRouter = Router();

chapterRouter.post("/buy/:chapterId", checkToken, chapterController.buyChapter);
chapterRouter.post("/", verifyToken, uploadTextFile, chapterController.createChapter);
chapterRouter.get("/story/:storyId", chapterController.getChaptersByStory);
chapterRouter.get("/story/:storySlug/chapter/:chapterNumber", checkToken, chapterController.getChapterByChapterNumber);
chapterRouter.get("/:id", chapterController.getChapterById);
chapterRouter.put("/:id", verifyToken, uploadTextFile, chapterController.updateChapter);
chapterRouter.delete("/:id", verifyToken, chapterController.deleteChapter);

export default chapterRouter;
