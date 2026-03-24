import { Transaction } from "../models/Transaction";
import { User } from "../models/User";
import { getPriceOfChapter } from "./chapterService";

const TransactionService = {
  async checkUserPurchasedChapter(userId: string, chapterId: string) {
    try {
      const transaction = await Transaction.exists({
        userId,
        chapterId,
        status: "success",
      });
      return !!transaction;
    } catch (error) {
      throw new Error(
        `Có lỗi xảy ra khi kiểm tra trạng thái mua chương của người dùng: ${error}`,
      );
    }
  },

  async userBuyChapter(userId: string, chapterId: string, stone: number) {
    const isExist = await this.checkUserPurchasedChapter(userId, chapterId);
    if (isExist) {
      return { success: true, enough: true };
    }
    const price = await getPriceOfChapter(chapterId);
    if (stone < price) {
      return { success: false, enough: false };
    }
    try {
      const transaction = await Transaction.create({
        userId,
        chapterId,
        spiritStones: price,
        stoneBefore: stone,
        stoneAfter: stone - price,
        type: "chapter_purchase",
        status: "success",
        description: `Mua chương ${chapterId}`,
        adminShare: 0.4 * price,
        authorShare: 0.6 * price,
      });
      if (!transaction) {
        return { success: false, enough: true };
      }
      await User.findByIdAndUpdate(userId, { $inc: { spiritStones: -price, totalSpent: price } });
      return { success: true, enough: true };
    } catch (error) {
      throw new Error(`Có lỗi xảy ra khi người dùng mua chương: ${error}`);
    }
  },
};

export default TransactionService;
