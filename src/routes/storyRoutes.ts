import express from "express";
import {
	createStory,
	deleteStory,
	getNewChapterStory,
	getRecommendStory,
	getStories,
	getStoryBySlug,
	getTop10Story,
	updateStory,
} from "../controllers/storyController";

const storyRouter = express.Router();

storyRouter.get("/recommend", getRecommendStory);
storyRouter.get("/newchapter", getNewChapterStory);
storyRouter.get("/top10", getTop10Story);
storyRouter.post("/", createStory);
storyRouter.get("/", getStories);
storyRouter.get("/:slug", getStoryBySlug);
storyRouter.put("/:id", updateStory);
storyRouter.delete("/:id", deleteStory);

export default storyRouter;
