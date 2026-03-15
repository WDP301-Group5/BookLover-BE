import express from "express";
import {
	changeStatusFollowStory,
	checkUserFollowStory,
	getMyFollowedStories,
} from "../controllers/followStoryController";
import { verifyToken } from "../middleware/auth";

const followStoryRouter = express.Router();

followStoryRouter.get("/my-following", verifyToken, getMyFollowedStories);
followStoryRouter.get("/check/:storyId", verifyToken, checkUserFollowStory);
followStoryRouter.post("/:storyId", verifyToken, changeStatusFollowStory);

export default followStoryRouter;
