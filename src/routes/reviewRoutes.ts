import { Router } from "express";
import {
  createReview,
  getReviews,
  getReviewStories,
} from "../controllers/reviewController";
import { verifyToken } from "../middleware/auth";

const reviewRoutes = Router();

reviewRoutes.get("/stories", getReviewStories);
reviewRoutes.get("/", getReviews);
reviewRoutes.post("/", verifyToken, createReview);

export default reviewRoutes;