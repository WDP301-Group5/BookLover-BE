// src/routes/chapterPage.ts
import { Router } from "express";
import * as chapterController from "../controllers/chapterPageController";

const chapterRouter = Router();

chapterRouter.post("/", chapterController.createChapter);
chapterRouter.get("/story/:storyId", chapterController.getChaptersByStory);
chapterRouter.get("/:id", chapterController.getChapterById);
chapterRouter.put("/:id", chapterController.updateChapter);
chapterRouter.delete("/:id", chapterController.deleteChapter);

export default chapterRouter;
