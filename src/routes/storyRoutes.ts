import express from "express";
import {
	getNewChapterStory,
	getRecommendStory,
	getTop10Story,
} from "../controllers/storyController";

const storyRouter = express.Router();

storyRouter.get("/recommend", getRecommendStory);
storyRouter.get("/newchapter", getNewChapterStory);
storyRouter.get("/top10", getTop10Story);

export default storyRouter;
