import { Router } from "express";
import { searchProfiles, searchStories } from "../controllers/searchController";

const searchRoutes = Router();

searchRoutes.get("/stories", searchStories);
searchRoutes.get("/profiles", searchProfiles);

export default searchRoutes;
