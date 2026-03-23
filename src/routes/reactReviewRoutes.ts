import express from "express";
import { checkToken } from "../middleware/auth";
import {
  getUserReactReviews,
  userReactReview,
} from "../controllers/reactReviewController";

const reactReviewRouter = express.Router();

reactReviewRouter.get("/user", checkToken, getUserReactReviews);
reactReviewRouter.post("/:reviewId", checkToken, userReactReview);

export default reactReviewRouter;