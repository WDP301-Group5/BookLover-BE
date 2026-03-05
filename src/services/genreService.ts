import type { IGenre } from "../interfaces/genre.js";
import { Genre } from "../models/Genre.js";

export const getAllGenres = async () => {
	return await Genre.find().sort({ name: 1 });
};

export const getGenreById = async (id: string) => {
	return await Genre.findById(id);
};

export const createGenre = async (data: Partial<IGenre>) => {
	const genre = new Genre(data);
	return await genre.save();
};

export const updateGenre = async (id: string, data: Partial<IGenre>) => {
	return await Genre.findByIdAndUpdate(id, data, { new: true });
};

export const deleteGenre = async (id: string) => {
	return await Genre.findByIdAndDelete(id);
};

export const deleteManyGenres = async (ids: string[]) => {
	return await Genre.deleteMany({ _id: { $in: ids } });
};
