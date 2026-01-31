import express from "express";
import storyRouter from "./storyRoutes.js";
import userRouter from "./userRoutes.js";

const routes = express.Router();

routes.use("/user", userRouter);
routes.use("/story", storyRouter);

export default routes;
