import { ReadingHistory } from "../models/ReadingHistory";

const ReadingHistoryService = {
	async addNewReadingHistory(
		userId: string,
		storyId: string,
		chapterNumber: number,
	) {
		try {
			const oldHistory = await ReadingHistory.findOne({
				userId,
				storyId,
			});
			if (oldHistory) {
				oldHistory.chapterNumber = chapterNumber;
				await oldHistory.save();
				return oldHistory;
			}
			const newHistory = new ReadingHistory({
				userId,
				storyId,
				chapterNumber: chapterNumber,
			});
			await newHistory.save();
			return newHistory;
		} catch (error) {
			throw new Error(`Error adding new reading history: ${error}`);
		}
	},

	async getLast3History(userId: string) {
		try {
			const histories = await ReadingHistory.find({ userId })
				.sort({ updatedAt: -1 })
				.populate("storyId")
				.limit(3)
				.lean();
			return histories;
		} catch (error) {
			throw new Error(`Error fetching last 3 reading histories: ${error}`);
		}
	},
};

export default ReadingHistoryService;
