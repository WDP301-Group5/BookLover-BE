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
import genresRouter from "./genresRoutes.js";
import topicRouter from "./topicRoutes.js";

const routes = express.Router();

routes.use("/admin", adminRouter);
routes.use("/auth", authRouter);
routes.use("/purchase", purchaseRoutes);
routes.use("/user", userRouter);
routes.use("/story", storyRouter);
routes.use("/order", orderRouter);
routes.use("/chapter", chapterRouter);
routes.use("/genres", genreRouter);
routes.use("/topics", topicRouter);
routes.use("/comment", commentRouter);
routes.use("/follow/story", followStoryRouter);
routes.use("/react/comment", reactCommentRouter);

export default routes;
