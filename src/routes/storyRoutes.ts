import express from 'express';
import {
	createStory,
	deleteStory,
	getMyStories,
	getNewChapterStory,
	getRecommendStory,
	getStories,
	getStoryBySlug,
	getTop10Story,
	readChapter,
	updateStory,
} from "../controllers/storyController";
import { verifyToken } from '../middleware/auth';
import { checkToken } from "../middleware/auth";
import { uploadStoryImage } from '../middleware/upload';

const storyRouter = express.Router();

storyRouter.get('/recommend', getRecommendStory);
storyRouter.get('/newchapter', getNewChapterStory);
storyRouter.get('/top10', getTop10Story);
storyRouter.get('/my-stories', verifyToken, getMyStories);
storyRouter.post("/read/:storyId", checkToken, readChapter);
storyRouter.post('/', verifyToken, uploadStoryImage, createStory);
storyRouter.get('/', getStories);
storyRouter.get('/:slug', getStoryBySlug);
storyRouter.put('/:id', verifyToken, updateStory);
storyRouter.delete('/:id', verifyToken, deleteStory);

export default storyRouter;
