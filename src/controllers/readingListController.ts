import { Request, Response } from "express";
import type { IReadingList } from "../interfaces/readingList";
import ReadingListService from "../services/readingListService";

export const createReadingList = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.userId as string;
		const { name } = req.body;

		if (!name) {
			return res.status(400).json({ message: "Name is required" });
		}

		const newList = await ReadingListService.createReadingList(userId, name);

		return res.status(201).json({
			success: true,
			data: newList,
			message: "Reading list created successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: `Error creating reading list: ${error}`,
		});
	}
};

export const getReadingListsByUserId = async (req: Request, res: Response) => {
	try {
		const userId = req.params.userId as string;

		if (!userId) {
			return res.status(400).json({ message: "User ID is required" });
		}

		const lists = await ReadingListService.getReadingListsByUserId(userId);

		return res.status(200).json({
			success: true,
			data: lists,
			message: "Reading lists fetched successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: `Error fetching reading lists: ${error}`,
		});
	}
};

export const getUserReadingLists = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.userId as string;

		if (!userId) {
			return res.status(400).json({ message: "User ID is required" });
		}

		const lists = await ReadingListService.getReadingListsByUserId(userId);

		return res.status(200).json({
			success: true,
			data: lists,
			message: "Reading lists fetched successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: `Error fetching reading lists: ${error}`,
		});
	}
};

export const getReadingListById = async (req: Request, res: Response) => {
	try {
		const { listId } = req.params as { listId: string };
		const userId = req.user?.userId as string;

		if (!listId) {
			return res.status(400).json({ message: "List ID is required" });
		}

		const list = await ReadingListService.getReadingListById(listId, userId);

		if (!list) {
			return res.status(404).json({ message: "Reading list not found" });
		}

		return res.status(200).json({
			success: true,
			data: list,
			message: "Reading list fetched successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: `Error fetching reading list: ${error}`,
		});
	}
};

export const updateReadingList = async (req: Request, res: Response) => {
	try {
		const { listId } = req.params as { listId: string };
		const userId = req.user?.userId as string;
		const updates = req.body;

		if (!listId) {
			return res.status(400).json({ message: "List ID is required" });
		}

		const updatedList = await ReadingListService.updateReadingList(
			listId,
			userId,
			updates,
		);

		return res.status(200).json({
			success: true,
			data: updatedList,
			message: "Reading list updated successfully",
		});
	} catch (error: any) {
		return res.status(500).json({
			success: false,
			message: `Error updating reading list: ${error.message}`,
		});
	}
};

export const deleteReadingList = async (req: Request, res: Response) => {
	try {
		const { listId } = req.params as { listId: string };
		const userId = req.user?.userId as string;

		if (!listId) {
			return res.status(400).json({ message: "List ID is required" });
		}

		const result = await ReadingListService.deleteReadingList(listId, userId);

		if (!result) {
			return res.status(404).json({ message: "Reading list not found" });
		}

		return res.status(200).json({
			success: true,
			message: "Reading list deleted successfully",
		});
	} catch (error: any) {
		return res.status(500).json({
			success: false,
			message: `Error deleting reading list: ${error.message}`,
		});
	}
};

export const addStoryToReadingList = async (req: Request, res: Response) => {
	try {
		const { listId } = req.params as { listId: string };
		const { storyId } = req.body;
		const userId = req.user?.userId as string;

		if (!listId || !storyId) {
			return res
				.status(400)
				.json({ message: "List ID and Story ID are required" });
		}

		const updatedList = await ReadingListService.addStoryToList(
			listId,
			storyId,
			userId,
		);

		return res.status(200).json({
			success: true,
			data: updatedList,
			message: "Story added to reading list successfully",
		});
	} catch (error: any) {
		return res.status(500).json({
			success: false,
			message: `Error adding story to reading list: ${error.message}`,
		});
	}
};

export const removeStoryFromReadingList = async (
	req: Request,
	res: Response,
) => {
	try {
		const { listId } = req.params as { listId: string };
		const { storyId } = req.body;
		const userId = req.user?.userId as string;

		if (!listId || !storyId) {
			return res
				.status(400)
				.json({ message: "List ID and Story ID are required" });
		}

		const updatedList = await ReadingListService.removeStoryFromList(
			listId,
			storyId,
			userId,
		);

		return res.status(200).json({
			success: true,
			data: updatedList,
			message: "Story removed from reading list successfully",
		});
	} catch (error: any) {
		return res.status(500).json({
			success: false,
			message: `Error removing story from reading list: ${error.message}`,
		});
	}
};

export const clearAllStoriesFromReadingList = async (
	req: Request,
	res: Response,
) => {
	try {
		const { listId } = req.params as { listId: string };
		const userId = req.user?.userId as string;

		if (!listId) {
			return res.status(400).json({ message: "List ID is required" });
		}

		const updatedList = await ReadingListService.clearAllStoriesFromList(
			listId,
			userId,
		);

		return res.status(200).json({
			success: true,
			data: updatedList,
			message: "All stories cleared from reading list successfully",
		});
	} catch (error: any) {
		return res.status(500).json({
			success: false,
			message: `Error clearing stories from reading list: ${error.message}`,
		});
	}
};

export const searchReadingLists = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.userId as string;
		const { query } = req.query as { query: string };

		if (!query || typeof query !== "string") {
			return res.status(400).json({ message: "Search query is required" });
		}

		const lists = await ReadingListService.searchReadingLists(userId, query);

		return res.status(200).json({
			success: true,
			data: lists,
			message: "Reading lists searched successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: `Error searching reading lists: ${error}`,
		});
	}
};
