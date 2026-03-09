import express from "express";
import { getTopics } from "../controllers/topicController";

const topicRouter = express.Router();

topicRouter.get("/", getTopics);

export default topicRouter;
