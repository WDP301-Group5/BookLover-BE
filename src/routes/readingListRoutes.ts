import express from "express";
import {
	addStoryToReadingList,
	clearAllStoriesFromReadingList,
	createReadingList,
	deleteReadingList,
	getReadingListById,
	getReadingListsByUserId,
	getUserReadingLists,
	removeStoryFromReadingList,
	searchReadingLists,
	updateReadingList,
} from "../controllers/readingListController";
import { checkToken, verifyToken } from "../middleware/auth";

const readingListRouter = express.Router();

// Public routes
readingListRouter.get("/:userId/lists", checkToken, getReadingListsByUserId);

// Private routes
readingListRouter.post("/create", verifyToken, createReadingList);
readingListRouter.get("/my-lists", verifyToken, getUserReadingLists);
readingListRouter.get("/list/:listId", verifyToken, getReadingListById);
readingListRouter.put("/list/:listId", verifyToken, updateReadingList);
readingListRouter.delete("/list/:listId", verifyToken, deleteReadingList);
readingListRouter.post(
	"/list/:listId/add-story",
	verifyToken,
	addStoryToReadingList,
);
readingListRouter.post(
	"/list/:listId/remove-story",
	verifyToken,
	removeStoryFromReadingList,
);
readingListRouter.post(
	"/list/:listId/clear-stories",
	verifyToken,
	clearAllStoriesFromReadingList,
);
readingListRouter.get("/search", verifyToken, searchReadingLists);

export default readingListRouter;
