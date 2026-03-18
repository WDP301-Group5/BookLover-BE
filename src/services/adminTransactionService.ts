import { Transaction } from "../models/Transaction";
import { User } from "../models/User";
import { BuyStone } from "../models/BuyStone";
import { Chapter } from "../models/Chapter";
import mongoose from "mongoose";
import { Story } from "../models/Story";

const AdminTransactionService = {
    // Lấy danh sách giao dịch
    async getAllTransactions(page: number, limit: number) {
        try {
            const transactions = await Transaction.find()
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 }) // Sắp xếp theo thời gian giảm dần
                .populate('userId', 'avatarURL username email') // Lấy avatar, username, email của User
                .populate({
                    path: "chapterId",
                    select: "title storyId isPremium price contentURL status",
                    populate: {
                        path: "storyId",
                        model: "Story",
                        select: "title authorId",
                        populate: {
                            path: "authorId",
                            model: "User",
                            select: "username email avatarURL",
                        },
                    },
                });

            return transactions;
        } catch (error) {
            throw new Error("Không thể lấy danh sách giao dịch");
        }
    },

    // Cập nhật trạng thái giao dịch
    async updateTransactionStatus(transactionId: string, status: string) {
        const validStatuses: ("success" | "failed" | "pending")[] = ["success", "failed", "pending"];

        if (!validStatuses.includes(status as "success" | "failed" | "pending")) {
            throw new Error("Trạng thái giao dịch không hợp lệ");
        }

        try {
            const transaction = await Transaction.findById(transactionId);
            if (!transaction) throw new Error("Giao dịch không tồn tại");

            transaction.status = status as "success" | "failed" | "pending";
            await transaction.save();

            return transaction;
        } catch (error: any) {
            throw new Error("Không thể cập nhật trạng thái giao dịch");
        }
    },

    async topUpStones(userId: string, amount: number) {
        const user = await User.findById(userId);
        if (!user) throw new Error("Người dùng không tồn tại");

        const stoneBefore = user.spiritStones;
        const stoneAfter = stoneBefore + amount;

        user.spiritStones = stoneAfter;
        await user.save();

        const transaction = await Transaction.create({
            id: new mongoose.Types.ObjectId().toString(),
            userId,
            type: "topup",
            spiritStones: amount,
            stoneBefore,
            stoneAfter,
            status: "success",
            adminShare: amount, // admin/system bán ra 10 stone
            authorShare: 0,
            description: `Nạp ${amount} linh thạch`,
        });

        return transaction;
    },

    async purchaseChapter(userId: string, chapterId: string) {
        const user = await User.findById(userId);
        if (!user) throw new Error("Người dùng không tồn tại");

        const chapter = await Chapter.findById(chapterId);
        if (!chapter) throw new Error("Chapter không tồn tại");

        if (!chapter.isPremium) {
            throw new Error("Chapter này không yêu cầu thanh toán");
        }

        const price = chapter.price || 0;
        if (price <= 0) {
            throw new Error("Giá chapter không hợp lệ");
        }

        if (user.spiritStones < price) {
            throw new Error("Không đủ linh thạch");
        }

        const alreadyBought = await Transaction.findOne({
            userId,
            chapterId,
            type: "chapter_purchase",
            status: "success",
        });

        if (alreadyBought) {
            throw new Error("Người dùng đã mua chapter này rồi");
        }

        const story = await Story.findById(chapter.storyId);
        if (!story) throw new Error("Truyện không tồn tại");

        const author = await User.findById(story.authorId);
        if (!author) throw new Error("Tác giả không tồn tại");

        const stoneBefore = user.spiritStones;
        const stoneAfter = stoneBefore - price;

        const adminShare = price * 0.4;
        const authorShare = price * 0.6;

        user.spiritStones = stoneAfter;
        user.totalSpent += price;
        await user.save();

        author.spiritStones += authorShare;
        await author.save();

        const transaction = await Transaction.create({
            id: new mongoose.Types.ObjectId().toString(),
            userId,
            chapterId,
            type: "chapter_purchase",
            spiritStones: price,
            stoneBefore,
            stoneAfter,
            status: "success",
            adminShare,
            authorShare,
            description: `Mua chapter ${chapter.title}`,
        });

        return transaction;
    },
    // Xem báo cáo giao dịch theo ngày, tháng, năm
    async getRevenueReport(dateRange: string) {
        try {
            let query: any = {};

            // Lọc theo khoảng thời gian
            if (dateRange === "today") {
                query.createdAt = { $gte: new Date(new Date().setHours(0, 0, 0, 0)) };  // hôm nay
            } else if (dateRange === "month") {
                query.createdAt = { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) }; // 1 tháng
            } else if (dateRange === "year") {
                query.createdAt = { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }; // 1 năm
            }

            const transactions = await Transaction.aggregate([
                { $match: query },
                { $group: { _id: null, totalRevenue: { $sum: "$spiritStones" } } }
            ]);

            return transactions;
        } catch (error) {
            throw new Error("Không thể lấy báo cáo doanh thu");
        }
    },
}

export default AdminTransactionService;