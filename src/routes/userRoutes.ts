import express from "express";
import { getAllUsers } from "../controllers/userController";

const userRouter = express.Router();

// TEST
userRouter.get("/test", getAllUsers);

export default userRouter;
