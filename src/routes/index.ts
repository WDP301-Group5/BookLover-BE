import express from "express";
import authRouter from "./authRoutes.js";
import purchaseRoutes from "./purchaseRoutes.js";
import userRouter from "./userRoutes.js";

const routes = express.Router();

routes.use("/auth", authRouter);
routes.use("/users", userRouter);
routes.use("/purchase", purchaseRoutes);

export default routes;
