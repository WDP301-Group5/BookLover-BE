import mongoose from "mongoose";
import { Chapter } from "../models/Chapter";
import { Transaction } from "../models/Transaction";
import Withdraw from "../models/Withdraw";
import { Story } from "../models/Story";

const AuthorRevenueService = {
  async getAuthorGeneralRevenueInfo(userId: string) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const totalPremiumChapters = await Chapter.aggregate([
        {
          $match: {
            isPremium: true,
          },
        },
        {
          $lookup: {
            from: "stories",
            localField: "storyId",
            foreignField: "_id",
            as: "story",
          },
        },
        { $unwind: "$story" },
        {
          $match: {
            "story.authorId": userObjectId,
            "story.isPremium": true,
          },
        },
        {
          $count: "totalPremiumChapters",
        },
      ]);

      const totalChapters = totalPremiumChapters[0]?.totalPremiumChapters || 0;

      const stats = await Transaction.aggregate([
        {
          $match: {
            type: "chapter_purchase",
            status: "success",
          },
        },

        // join chapter
        {
          $lookup: {
            from: "chapters",
            localField: "chapterId",
            foreignField: "_id",
            as: "chapter",
          },
        },
        { $unwind: "$chapter" },

        // join story
        {
          $lookup: {
            from: "stories",
            localField: "chapter.storyId",
            foreignField: "_id",
            as: "story",
          },
        },
        { $unwind: "$story" },

        {
          $match: {
            "story.authorId": userObjectId,
            "chapter.isPremium": true,
          },
        },

        {
          $group: {
            _id: null,
            totalPurchases: { $sum: 1 },
            totalRevenue: { $sum: "$authorShare" },
          },
        },
      ]);
      const totalPurchases = stats[0]?.totalPurchases || 0;
      const totalRevenue = Number(stats[0]?.totalRevenue) * 1000 || 0;

      const totalWithdraw = await Withdraw.aggregate([
        {
          $match: {
            userId: userObjectId,
          },
        },
        {
          $group: {
            _id: null,
            totalWithdraw: { $sum: "$amount" },
          },
        },
      ]);
      const totalWithdrawAmount = totalWithdraw[0]?.totalWithdraw || 0;

      return {
        totalChapters,
        totalPurchases,
        totalRevenue,
        totalWithdrawAmount,
      };
    } catch (error) {
      throw new Error(`Error getting author general info: ${error}`);
    }
  },

  async getAllTransactionForAuthor(
    userId: string,
    offset: number = 0,
    limit: number = 20,
    storyId?: string,
    fromDate?: Date,
    toDate?: Date,
  ) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const match = {
        type: "chapter_purchase",
        status: "success",
        ...(fromDate || toDate
          ? {
              createdAt: {
                ...(fromDate && { $gte: fromDate }),
                ...(toDate && { $lte: toDate }),
              },
            }
          : {}),
      };
      const storyMatch = {
        "story.authorId": userObjectId,
        "chapter.isPremium": true,
        ...(storyId && { "story._id": new mongoose.Types.ObjectId(storyId) }),
      };
      const results = await Transaction.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$chapterId",
            totalPurchases: { $sum: 1 },
            totalRevenue: { $sum: "$authorShare" },
            chapterId: { $first: "$chapterId" },
          },
        },
        {
          $lookup: {
            from: "chapters",
            localField: "chapterId",
            foreignField: "_id",
            as: "chapter",
          },
        },
        { $unwind: "$chapter" },

        {
          $lookup: {
            from: "stories",
            localField: "chapter.storyId",
            foreignField: "_id",
            as: "story",
          },
        },
        { $unwind: "$story" },
        { $match: storyMatch },
        {
          $facet: {
            data: [
              { $sort: { "chapter.createdAt": 1 } },
              { $skip: offset },
              { $limit: limit },
            ],
            total: [{ $count: "count" }],
          },
        },
      ]);
      const transactions = results[0].data;
      const total = results[0].total[0]?.count || 0;
      return { transactions, total };
    } catch (error) {
      throw new Error(`Error getting all transactions: ${error}`);
    }
  },

  async getAllPremiumStorys(userId: string) {
    try {
      const stories = await Story.find({ isPremium: true, authorId: userId }).select("title slug").lean();
      const format = stories.map((story) => ({
        id: story._id,
        title: story.title,
        slug: story.slug,
      }))
      return format;
    } catch (error) {
      throw new Error(`Error getting all premium stories: ${error}`);
    }
  },
};

export default AuthorRevenueService;
