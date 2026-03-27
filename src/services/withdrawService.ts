import mongoose from "mongoose";
import { Transaction } from "../models/Transaction";
import Withdraw from "../models/Withdraw";

const WithdrawService = {
  async createWithdraw(userId: string, phoneNumber: string, amount: number) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const incomeResult = await Transaction.aggregate([
        {
          $match: {
            type: "chapter_purchase",
            status: "success",
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
        {
          $match: {
            "story.authorId": userObjectId,
            "chapter.isPremium": true,
          },
        },
        {
          $group: {
            _id: null,
            totalIncome: { $sum: "$authorShare" },
          },
        },
      ]);

      const withdrawResult = await Withdraw.aggregate([
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

      const totalIncome = Number(incomeResult[0]?.totalIncome || 0) * 1000;
      const totalWithdraw = Number(withdrawResult[0]?.totalWithdraw || 0);
      const remainingBalance = totalIncome - totalWithdraw;

      if (amount > remainingBalance) {
        throw new Error("Insufficient balance");
      }

      const data = await Withdraw.create({ userId, phoneNumber, amount });
      return data;
    } catch (error) {
      throw new Error("Error creating withdraw: " + error);
    }
  },

  async getWithdraws(userId: string, fromDate?: Date, toDate?: Date) {
    try {
      const filter: any = { userId };

      if (fromDate || toDate) {
        filter.createdAt = {};

        if (fromDate) {
          filter.createdAt.$gte = fromDate;
        }

        if (toDate) {
          filter.createdAt.$lte = toDate;
        }
      }

      const data = await Withdraw.find(filter);
      return data;
    } catch (error) {
      throw new Error("Error getting withdraws: " + error);
    }
  },

  async updateWithdraw(id: string, status: string) {
    try {
      const withdraw = await Withdraw.findByIdAndUpdate(
        id,
        { status },
        { new: true },
      );
      return withdraw;
    } catch (error) {
      throw new Error("Error updating withdraw: " + error);
    }
  },
};

export default WithdrawService;
