// src/services/genresService.ts
import { ITopic } from "../interfaces/topic";
import { Topic } from "../models/Topic";

type FilterOptions = {
	status?: "active" | "inactive";
	search?: string;
};

const GenresService = {
	/**
	 * Lấy tất cả genres
	 */
	async getAllGenres() {
		try {
			const genres = await Topic.find().lean();
			return genres;
		} catch (error) {
			console.error("Error fetching all genres:", error);
			throw new Error(`Error fetching all genres: ${error}`);
		}
	},

	/**
	 * Lấy genres đang active
	 */
	async getActiveGenres() {
		try {
			const genres = await Topic.find({ status: "active" }).lean();
			return genres;
		} catch (error) {
			console.error("Error fetching active genres:", error);
			throw new Error(`Error fetching active genres: ${error}`);
		}
	},

	/**
	 * Tìm kiếm genres theo name và trạng thái
	 */
	async searchGenres(opts: FilterOptions) {
		try {
			const { status, search } = opts;
			const filter: any = {};
			if (status) filter.status = status;
			if (search) filter.name = { $regex: search, $options: "i" };

			const genres = await Topic.find(filter).lean();
			return genres;
		} catch (error) {
			console.error("Error searching genres:", error);
			throw new Error(`Error searching genres: ${error}`);
		}
	},

	/**
	 * Tạo mới một genre
	 */
	async createGenre(data: Partial<ITopic>) {
		try {
			const genre = await Topic.create(data);
			return genre;
		} catch (error) {
			console.error("Error creating genre:", error);
			throw new Error(`Error creating genre: ${error}`);
		}
	},

	/**
	 * Cập nhật một genre theo id
	 */
	async updateGenre(id: string, data: Partial<ITopic>) {
		try {
			const genre = await Topic.findByIdAndUpdate(id, data, { new: true });
			return genre;
		} catch (error) {
			console.error("Error updating genre:", error);
			throw new Error(`Error updating genre: ${error}`);
		}
	},

	/**
	 * Xóa một genre theo id
	 */
	async deleteGenre(id: string) {
		try {
			await Topic.findByIdAndDelete(id);
			return { message: "Genre deleted successfully" };
		} catch (error) {
			console.error("Error deleting genre:", error);
			throw new Error(`Error deleting genre: ${error}`);
		}
	},
};

export default GenresService;
