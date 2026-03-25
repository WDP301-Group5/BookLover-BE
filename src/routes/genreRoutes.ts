import express from "express";
import * as genreController from "../controllers/genreController.js";
import { getGenres } from "../controllers/genresController.js";
import { uploadGenreAvatar } from "../middleware/upload.js";

const genreRouter = express.Router();

genreRouter.get("/", genreController.getAllGenres);
genreRouter.get("/all-genres", getGenres);
genreRouter.get("/:id", genreController.getGenreById);
genreRouter.post("/", uploadGenreAvatar, genreController.createGenre);
genreRouter.put("/:id", uploadGenreAvatar, genreController.updateGenre);
genreRouter.delete("/:id", genreController.deleteGenre);
genreRouter.post("/delete-many", genreController.deleteManyGenres);

export default genreRouter;
