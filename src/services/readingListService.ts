import type {
	IReadingList,
	IReadingListWithStories,
} from "../interfaces/readingList.js";
import { ReadingList } from "../models/ReadingList.js";

const ReadingListService = {
	async createReadingList(userId: string, name: string): Promise<IReadingList> {
		try {
			const newList = new ReadingList({
				userId,
				name,
				stories: [],
			});
			await newList.save();
			return {
				_id: newList._id?.toString(),
				id: newList._id?.toString(),
				userId: newList.userId.toString(),
				name: newList.name,
				stories: newList.stories as any,
				createdAt: newList.createdAt,
				updatedAt: newList.updatedAt,
			};
		} catch (error) {
			throw new Error(`Error creating reading list: ${error}`);
		}
	},

	async getReadingListsByUserId(
		userId: string,
	): Promise<IReadingListWithStories[]> {
		try {
			const lists = (await ReadingList.find({ userId })
				.sort({ createdAt: -1 })
				.populate({
					path: "stories",
					populate: {
						path: "authorId",
						select: "name username",
					},
				})
				.lean()) as any[];
			return lists.map((list: any) => ({
				...list,
				_id: list._id?.toString(),
				id: list._id?.toString(),
				userId:
					typeof list.userId === "string"
						? list.userId
						: list.userId?.toString(),
			})) as unknown as IReadingListWithStories[];
		} catch (error) {
			throw new Error(`Error fetching reading lists: ${error}`);
		}
	},

	async getReadingListById(
		listId: string,
		userId?: string,
	): Promise<IReadingListWithStories | null> {
		try {
			// For public viewing: just get the list by ID (no owner check)
			// Edit/delete operations check ownership separately
			const list = await ReadingList.findOne({ _id: listId })
				.populate({
					path: "stories",
					populate: {
						path: "authorId",
						select: "name username",
					},
				})
				.lean();
			if (!list) return null;
			return {
				...list,
				_id: list._id?.toString(),
				id: list._id?.toString(),
				userId: list.userId.toString(),
			} as IReadingListWithStories;
		} catch (error) {
			throw new Error(`Error fetching reading list: ${error}`);
		}
	},

	async updateReadingList(
		listId: string,
		userId: string,
		updates: Partial<IReadingList>,
	): Promise<IReadingList> {
		try {
			const list = await ReadingList.findOneAndUpdate(
				{ _id: listId, userId },
				updates,
				{ new: true },
			).lean();
			if (!list) {
				throw new Error("Reading list not found");
			}
			return {
				...list,
				_id: list._id?.toString(),
				id: list._id?.toString(),
				userId: list.userId.toString(),
			};
		} catch (error) {
			throw new Error(`Error updating reading list: ${error}`);
		}
	},

	async deleteReadingList(listId: string, userId: string): Promise<boolean> {
		try {
			const result = await ReadingList.deleteOne({ _id: listId, userId });
			return result.deletedCount > 0;
		} catch (error) {
			throw new Error(`Error deleting reading list: ${error}`);
		}
	},

	async addStoryToList(
		listId: string,
		storyId: string,
		userId: string,
	): Promise<IReadingList> {
		try {
			const list = await ReadingList.findOne({ _id: listId, userId });
			if (!list) {
				throw new Error("Reading list not found");
			}
			if (!list.stories.includes(storyId as any)) {
				list.stories.push(storyId as any);
				await list.save();
			}
			return {
				_id: list._id?.toString(),
				id: list._id?.toString(),
				userId: String(list.userId),
				name: list.name,
				stories: list.stories.map((s: any) => s.toString()),
				createdAt: list.createdAt,
				updatedAt: list.updatedAt,
			};
		} catch (error) {
			throw new Error(`Error adding story to list: ${error}`);
		}
	},

	async removeStoryFromList(
		listId: string,
		storyId: string,
		userId: string,
	): Promise<IReadingList> {
		try {
			const list = await ReadingList.findOne({ _id: listId, userId });
			if (!list) {
				throw new Error("Reading list not found");
			}
			list.stories = list.stories.filter((s: any) => s.toString() !== storyId);
			await list.save();
			return {
				_id: list._id?.toString(),
				id: list._id?.toString(),
				userId: String(list.userId),
				name: list.name,
				stories: list.stories.map((s: any) => s.toString()),
				createdAt: list.createdAt,
				updatedAt: list.updatedAt,
			};
		} catch (error) {
			throw new Error(`Error removing story from list: ${error}`);
		}
	},

	async clearAllStoriesFromList(
		listId: string,
		userId: string,
	): Promise<IReadingList> {
		try {
			const list = await ReadingList.findOne({ _id: listId, userId });
			if (!list) {
				throw new Error("Reading list not found");
			}
			list.stories = [];
			await list.save();
			return {
				_id: list._id?.toString(),
				id: list._id?.toString(),
				userId: String(list.userId),
				name: list.name,
				stories: [],
				createdAt: list.createdAt,
				updatedAt: list.updatedAt,
			};
		} catch (error) {
			throw new Error(`Error clearing stories from list: ${error}`);
		}
	},

	async searchReadingLists(
		userId: string,
		query: string,
	): Promise<IReadingListWithStories[]> {
		try {
			const lists = (await ReadingList.find({
				userId,
				name: { $regex: query, $options: "i" },
			})
				.sort({ createdAt: -1 })
				.populate({
					path: "stories",
					populate: {
						path: "authorId",
						select: "name username",
					},
				})
				.lean()) as any[];
			return lists.map((list: any) => ({
				...list,
				_id: list._id?.toString(),
				id: list._id?.toString(),
				userId:
					typeof list.userId === "string"
						? list.userId
						: list.userId?.toString(),
			})) as unknown as IReadingListWithStories[];
		} catch (error) {
			throw new Error(`Error searching reading lists: ${error}`);
		}
	},
};

export default ReadingListService;
