import express from "express";
import authRouter from "./authRoutes.js";
import userRouter from "./userRoutes.js";

const routes = express.Router();

routes.use("/auth", authRouter);
routes.use("/users", userRouter);

export default routes;
