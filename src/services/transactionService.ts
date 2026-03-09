import { Transaction } from "../models/Transaction";

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
};

export default TransactionService;
