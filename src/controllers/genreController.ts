import type { Request, Response } from "express";
import {
	ERR_BAD_REQUEST,
	ERR_INTERNAL_SERVER,
	ERR_NOT_FOUND,
} from "../consts/errorCode.js";
import * as genreService from "../services/genreService.js";

export const getAllGenres = async (_req: Request, res: Response) => {
	try {
		const genres = await genreService.getAllGenres();
		res.json(genres);
	} catch {
		res.status(ERR_INTERNAL_SERVER).json({ message: "Internal Server Error" });
	}
};

export const getGenreById = async (req: Request, res: Response) => {
	try {
		const genre = await genreService.getGenreById(req.params.id);
		if (!genre) {
			return res.status(ERR_NOT_FOUND).json({ message: "Genre not found" });
		}
		res.json(genre);
	} catch {
		res.status(ERR_INTERNAL_SERVER).json({ message: "Internal Server Error" });
	}
};

export const createGenre = async (req: Request, res: Response) => {
	try {
		const genre = await genreService.createGenre(req.body);
		res.status(201).json(genre);
	} catch {
		res.status(ERR_BAD_REQUEST).json({ message: "Bad Request" });
	}
};

export const updateGenre = async (req: Request, res: Response) => {
	try {
		const genre = await genreService.updateGenre(req.params.id, req.body);
		if (!genre) {
			return res.status(ERR_NOT_FOUND).json({ message: "Genre not found" });
		}
		res.json(genre);
	} catch {
		res.status(ERR_BAD_REQUEST).json({ message: "Bad Request" });
	}
};

export const deleteGenre = async (req: Request, res: Response) => {
	try {
		const genre = await genreService.deleteGenre(req.params.id);
		if (!genre) {
			return res.status(ERR_NOT_FOUND).json({ message: "Genre not found" });
		}
		res.json({ message: "Genre deleted successfully" });
	} catch {
		res.status(ERR_INTERNAL_SERVER).json({ message: "Internal Server Error" });
	}
};

export const deleteManyGenres = async (req: Request, res: Response) => {
	try {
		const { ids } = req.body;
		if (!Array.isArray(ids) || ids.length === 0) {
			return res.status(ERR_BAD_REQUEST).json({ message: "Invalid IDs" });
		}
		await genreService.deleteManyGenres(ids);
		res.json({ message: "Genres deleted successfully" });
	} catch {
		res.status(ERR_INTERNAL_SERVER).json({ message: "Internal Server Error" });
	}
};
