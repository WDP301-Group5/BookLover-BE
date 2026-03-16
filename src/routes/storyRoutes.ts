import express from "express";
import {
  createStory,
  deleteStory,
  getMyStories,
  getNewChapterStory,
  getNewChapterStoryWithFilter,
  getRecommendStory,
  getStories,
  getStoryBySlug,
  getStoryWithAuthor,
  getTop10Story,
  readChapter,
  updateStory,
} from "../controllers/storyController";
import { verifyToken } from "../middleware/auth";
import { checkToken } from "../middleware/auth";
import { uploadStoryImage } from "../middleware/upload";
import { getGenres } from "../controllers/genresController";

const storyRouter = express.Router();

storyRouter.get("/recommend", checkToken, getRecommendStory);
storyRouter.get("/newchapter", getNewChapterStory);
storyRouter.get("/top10", getTop10Story);
storyRouter.get("/search", getNewChapterStoryWithFilter);
storyRouter.get("/my-stories", verifyToken, getMyStories);
storyRouter.get("/with-author/:slug", getStoryWithAuthor);
storyRouter.post("/read/:storyId", checkToken, readChapter);
storyRouter.post("/", verifyToken, uploadStoryImage, createStory);
storyRouter.get("/", getStories);
storyRouter.get("/topics", getGenres);
storyRouter.get("/:slug", getStoryBySlug);
storyRouter.put("/:id", verifyToken, uploadStoryImage, updateStory);
storyRouter.delete("/:id", verifyToken, deleteStory);

export default storyRouter;
