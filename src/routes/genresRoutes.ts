// src/routes/genresRoutes.ts
import express from "express";
import { getGenres } from "../controllers/genresController";

const genresRouter = express.Router();

genresRouter.get("/", getGenres); // Lấy danh sách genres

export default genresRouter;