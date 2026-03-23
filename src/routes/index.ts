// src/routes/index.ts
import express from "express";
import adminRouter from "./adminRoutes.js";
import authRouter from "./authRoutes.js";
import chapterRouter from "./chapterRoutes.js";
import genreRouter from "./genreRoutes.js";
import commentRouter from "./commentRoutes.js";
import followStoryRouter from "./followStoryRoutes.js";
import orderRouter from "./orderRoutes.js";
import purchaseRoutes from "./purchaseRoutes.js";
import reactCommentRouter from "./reactCommentRoutes.js";
import storyRouter from "./storyRoutes.js";
import topicRouter from "./topicRoutes.js";
import userRouter from "./userRoutes.js";
import uploadRouter from "./uploadRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import rankingRoutes from "./rankingRoutes.js";
import searchRoutes from "./searchRoutes.js";
import chatingRouter from "./chatingRoutes.js";
import forumRouter from "./forumRoutes.js";
import reviewRoutes from "./reviewRoutes.js";
import readingListRouter from "./readingListRoutes.js";
import reactReviewRouter from "./reactReviewRoutes.js";

const routes = express.Router();

routes.use("/admin", adminRouter);
routes.use("/auth", authRouter);
routes.use("/purchase", purchaseRoutes);
routes.use("/upload", uploadRouter);
routes.use("/user", userRouter);
routes.use("/story", storyRouter);
routes.use("/order", orderRouter);
routes.use("/chapter", chapterRouter);
routes.use("/genres", genreRouter);
routes.use("/topics", topicRouter);
routes.use("/comment", commentRouter);
routes.use("/follow/story", followStoryRouter);
routes.use("/react/comment", reactCommentRouter);
routes.use("/notifications", notificationRoutes);
routes.use("/rankings", rankingRoutes);
routes.use("/search", searchRoutes);
routes.use("/chating", chatingRouter);
routes.use("/forum", forumRouter);
routes.use("/review", reviewRoutes);
routes.use("/react/review", reactReviewRouter);
routes.use("/reading-list", readingListRouter);

export default routes;
