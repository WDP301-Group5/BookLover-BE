import express from "express";
import { addNewReadingHistory } from "../controllers/readingHistoryController";
import { getAllUsers, getLast3History } from "../controllers/userController";

const userRouter = express.Router();

// TEST
userRouter.get("/test", getAllUsers);
userRouter.get("/history/last3", getLast3History);
userRouter.put("/history/reading", addNewReadingHistory);

export default userRouter;
