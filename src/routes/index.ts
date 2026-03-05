import express from "express";
import authRouter from "./authRoutes.js";
import chapterRouter from "./chapterPage.js";
import orderRouter from "./orderRoutes.js";
import purchaseRoutes from "./purchaseRoutes.js";
import storyRouter from "./storyRoutes.js";
import userRouter from "./userRoutes.js";

const routes = express.Router();

routes.use("/auth", authRouter);
routes.use("/purchase", purchaseRoutes);
routes.use("/user", userRouter);
routes.use("/story", storyRouter);
routes.use("/order", orderRouter);
routes.use("/chapter", chapterRouter);

export default routes;
