import { BuyStone } from "../models/BuyStone";
import { Comment } from "../models/Comment";
import { Review } from "../models/Review";
import { Transaction } from "../models/Transaction";

const HistoryService = {
  async getCommentHistory(
    userId: string,
    offset: number = 0,
    limit: number = 24,
  ) {
    try {
      const history = await Comment.find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate({
          path: "chapterId",
          select: "storyId chapterNumber",
          populate: {
            path: "storyId",
            select: "title slug image",
          },
        })
        .lean();
      const formatHistory = history?.map((comment) => ({
        ...comment,
        id: comment._id.toString(),
      }));
      const total = await Comment.countDocuments({ userId });
      return { history: formatHistory, total };
    } catch (error) {
      throw new Error(`Error getting comment history: ${error}`);
    }
  },

  async getReviewHistory(
    userId: string,
    offset: number = 0,
    limit: number = 24,
  ) {
    try {
      const history = await Review.find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate("storyId")
        .lean();

      const total = await Review.countDocuments({ userId });
      return { history, total };
    } catch (error) {
      throw new Error(`Error getting review history: ${error}`);
    }
  },

  async getRechargeHistory(
    userId: string,
    offset: number = 0,
    limit: number = 24,
  ) {
    try {
      const history = await BuyStone.find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean();
      const total = await BuyStone.countDocuments({ userId });
      return { history, total };
    } catch (error) {
      throw new Error(`Error getting recharge history: ${error}`);
    }
  },

  async getPurchaseHistory(
    userId: string,
    offset: number = 0,
    limit: number = 24,
  ) {
    try {
      const history = await Transaction.find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate({
          path: "chapterId",
          select: "storyId chapterNumber",
          populate: { path: "storyId", select: "title slug image" },
        })
        .lean();
      const total = await Transaction.countDocuments({ userId });
      return { history, total };
    } catch (error) {
      throw new Error(`Error getting purchase history: ${error}`);
    }
  },
};

export default HistoryService;
