// src/routes/chapterPage.ts
import { Router } from "express";
import * as chapterController from "../controllers/chapterController";
import { uploadTextFile } from "../middleware/upload";

const chapterRouter = Router();

chapterRouter.post("/", chapterController.createChapter);
chapterRouter.get("/story/:storyId", chapterController.getChaptersByStory);
chapterRouter.get(
	"/story/:storySlug/chapter/:chapterNumber",
	chapterController.getChapterByChapterNumber,
);
chapterRouter.put("/:id", chapterController.updateChapter);
chapterRouter.delete("/:id", chapterController.deleteChapter);
chapterRouter.post(
	"/testfile",
	uploadTextFile,
	chapterController.testFileUpload,
);

export default chapterRouter;
