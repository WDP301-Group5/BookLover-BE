import express from "express";
import {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
} from "../controllers/topicController";

const topicRouter = express.Router();

topicRouter.get("/", getTopics);          
topicRouter.post("/", createTopic);        
topicRouter.put("/:id", updateTopic);      
topicRouter.delete("/:id", deleteTopic);   
export default topicRouter;