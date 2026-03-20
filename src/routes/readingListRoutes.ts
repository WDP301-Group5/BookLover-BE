import express from "express";
import { checkToken, verifyToken } from "../middleware/auth";
import {
  createReadingList,
  getReadingListsByUserId,
  getUserReadingLists,
  getReadingListById,
  updateReadingList,
  deleteReadingList,
  addStoryToReadingList,
  removeStoryFromReadingList,
  clearAllStoriesFromReadingList,
  searchReadingLists,
} from "../controllers/readingListController";

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
