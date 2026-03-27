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
            status: "success",
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

  async adminGetAllWithdraws(offset: number, limit: number, status: string) {
    try {
      const find = { ...(status && status.trim().length > 0 && { status }) };
      const data = await Withdraw.find(find).skip(offset).limit(limit).populate("userId");
      const count = await Withdraw.countDocuments(find);
      return { data, count };
    } catch (error) {
      throw new Error("Error getting withdraws: " + error);
    }
  },

  async adminUpdateWithdraw(
    id: string,
    status: "pending" | "success" | "failed" | "cancelled",
  ) {
    try {
      const withdraw = await Withdraw.findById(id);
      if (!withdraw) {
        throw new Error("Withdraw not found");
      }
      const userId = withdraw?.userId || "";

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
            status: "success",
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

      if (withdraw.amount > remainingBalance) {
        withdraw.status = "failed";
        await withdraw.save();
        return withdraw;
      } else {
        withdraw.status = status;
        await withdraw.save();
      }
      return withdraw;
    } catch (error) {
      throw new Error("Error updating withdraw: " + error);
    }
  },
};

export default WithdrawService;
