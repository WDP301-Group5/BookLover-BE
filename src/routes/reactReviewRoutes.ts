import express from "express";
import {
	getUserReactReviews,
	userReactReview,
} from "../controllers/reactReviewController";
import { checkToken } from "../middleware/auth";

const reactReviewRouter = express.Router();

reactReviewRouter.get("/user", checkToken, getUserReactReviews);
reactReviewRouter.post("/:reviewId", checkToken, userReactReview);

export default reactReviewRouter;
