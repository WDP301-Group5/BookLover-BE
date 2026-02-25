import express from "express";
import chapterRouter from "./chapterPage.js";
import storyRouter from "./storyPage.js";
import userRouter from "./userRoutes.js";

const routes = express.Router();

routes.use("/users", userRouter);
routes.use("/story", storyRouter);
routes.use("/chapter", chapterRouter);

export default routes;
