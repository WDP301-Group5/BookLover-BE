// src/routes/storyPage.ts
import { Router } from "express";
import * as storyController from "../controllers/storyPageController";

const storyRouter = Router();

storyRouter.post("/", storyController.createStory);
storyRouter.get("/", storyController.getStories);
storyRouter.get("/:id", storyController.getStoryById);
storyRouter.put("/:id", storyController.updateStory);
storyRouter.delete("/:id", storyController.deleteStory);

export default storyRouter;
