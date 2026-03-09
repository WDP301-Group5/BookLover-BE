import express from "express";
import authRouter from "./authRoutes.js";
import chapterRouter from "./chapterRoutes.js";
import commentRouter from "./commentRoutes.js";
import followStoryRouter from "./followStoryRoutes.js";
import orderRouter from "./orderRoutes.js";
import purchaseRoutes from "./purchaseRoutes.js";
import reactCommentRouter from "./reactCommentRoutes.js";
import storyRouter from "./storyRoutes.js";
import userRouter from "./userRoutes.js";

const routes = express.Router();

routes.use("/auth", authRouter);
routes.use("/purchase", purchaseRoutes);
routes.use("/user", userRouter);
routes.use("/story", storyRouter);
routes.use("/order", orderRouter);
routes.use("/chapter", chapterRouter);
routes.use("/comment", commentRouter);
routes.use("/follow/story", followStoryRouter);
routes.use("/react/comment", reactCommentRouter);

export default routes;
