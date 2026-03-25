import { Router } from "express";
import {
	getTopAuthors,
	getTopStories,
	getTopUsers,
} from "../controllers/rankingController";

const rankingRoutes = Router();

rankingRoutes.get("/stories", getTopStories);
rankingRoutes.get("/authors", getTopAuthors);
rankingRoutes.get("/users", getTopUsers);

export default rankingRoutes;
