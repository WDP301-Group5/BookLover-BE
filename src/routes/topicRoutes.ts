import express from "express";
import { createTopic, deleteManyTopics, deleteTopic, getAllTopics, getOneTopic, getTopics, updateTopic } from "../controllers/topicController";
import { verifyToken } from "../middleware/auth";

const topicRouter = express.Router();

topicRouter.get("/", getTopics);
topicRouter.get("/all-topics", verifyToken, getAllTopics);
topicRouter.get("/:id", verifyToken, getOneTopic);
topicRouter.post("/", verifyToken, createTopic);
topicRouter.put("/:id", verifyToken, updateTopic);
topicRouter.delete("/many", verifyToken, deleteManyTopics);
topicRouter.delete("/:id", verifyToken, deleteTopic);

export default topicRouter;
