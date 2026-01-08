import express from "express";
import userRouter from "./userRoutes.js";

const routes = express.Router();

routes.use("/users", userRouter);

export default routes;
