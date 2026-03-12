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
      const formatHistories = histories?.map((history) => ({
        ...history,
        id: history._id.toString(),
      }));
      return formatHistories;
    } catch (error) {
      throw new Error(`Error fetching last 3 reading histories: ${error}`);
    }
  },

  async deleteHistory(userId: string, historyId: string) {
    try {
      await ReadingHistory.deleteOne({ userId, _id: historyId });
      return true;
    } catch (error) {
      throw new Error(`Error deleting reading history: ${error}`);
    }
  },

  async getReadingHistory(userId: string, offset: number = 0, limit: number = 24) {
    try {
      const histories = await ReadingHistory.find({ userId })
        .sort({ updatedAt: -1 })
        .populate("storyId")
        .skip(offset)
        .limit(limit)
        .lean();
      const total = await ReadingHistory.countDocuments({ userId });
      const formatHistory = histories?.map((history) => ({
        ...history,
        id: history._id.toString(),
        story: history.storyId,
      }));
      return {
        history: formatHistory,
        total,
      };
    } catch (error) {
      throw new Error(`Error fetching reading history: ${error}`);
    }
  },
};

export default ReadingHistoryService;
