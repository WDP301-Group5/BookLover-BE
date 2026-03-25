import express from "express";
import { getGenres } from "../controllers/genresController";
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
	rateStory,
	readChapter,
	unpublishStory,
	updateStory,
} from "../controllers/storyController";
import { checkToken, verifyToken } from "../middleware/auth";
import { uploadStoryImage } from "../middleware/upload";

const storyRouter = express.Router();

storyRouter.get("/recommend", checkToken, getRecommendStory);
storyRouter.get("/newchapter", getNewChapterStory);
storyRouter.get("/top10", getTop10Story);
storyRouter.get("/search", getNewChapterStoryWithFilter);
storyRouter.get("/my-stories", verifyToken, getMyStories);
storyRouter.get("/with-author/:slug", checkToken, getStoryWithAuthor);
storyRouter.post("/read/:storyId", checkToken, readChapter);
storyRouter.post("/", verifyToken, uploadStoryImage, createStory);
storyRouter.get("/", getStories);
storyRouter.get("/topics", getGenres);
storyRouter.post("/:storyId/rate", verifyToken, rateStory);
storyRouter.patch("/:id/unpublish", verifyToken, unpublishStory);
storyRouter.get("/:slug", checkToken, getStoryBySlug);
storyRouter.put("/:id", verifyToken, uploadStoryImage, updateStory);
storyRouter.delete("/:id", verifyToken, deleteStory);

export default storyRouter;
