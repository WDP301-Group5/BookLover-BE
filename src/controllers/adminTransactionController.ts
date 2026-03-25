import { Request, Response } from "express";
import AdminTransactionService from "../services/adminTransactionService";

// Lấy danh sách giao dịch
export const getTransactions = async (req: Request, res: Response) => {
	try {
		const { page = 1, limit = 10 } = req.query;

		const transactions = await AdminTransactionService.getAllTransactions(
			Number(page),
			Number(limit),
		);

		return res.status(200).json({
			success: true,
			data: transactions,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: "Không thể lấy danh sách giao dịch";

		return res.status(500).json({
			success: false,
			message,
		});
	}
};

// Cập nhật trạng thái giao dịch
export const updateStatus = async (req: Request, res: Response) => {
	try {
		const { transactionId, status } = req.body;

		if (!transactionId || !status) {
			return res.status(400).json({
				success: false,
				message: "transactionId và status là bắt buộc",
			});
		}

		const updatedTransaction =
			await AdminTransactionService.updateTransactionStatus(
				transactionId,
				status,
			);

		return res.status(200).json({
			success: true,
			data: updatedTransaction,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: "Không thể cập nhật trạng thái giao dịch";

		return res.status(500).json({
			success: false,
			message,
		});
	}
};

// Nạp linh thạch
export const topUpStones = async (req: Request, res: Response) => {
	try {
		const { userId, amount } = req.body;

		if (!userId || amount === undefined) {
			return res.status(400).json({
				success: false,
				message: "userId và amount là bắt buộc",
			});
		}

		const transaction = await AdminTransactionService.topUpStones(
			userId,
			Number(amount),
		);

		return res.status(201).json({
			success: true,
			data: transaction,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Không thể nạp linh thạch";

		return res.status(500).json({
			success: false,
			message,
		});
	}
};

// Mua chapter
export const purchaseChapter = async (req: Request, res: Response) => {
	try {
		const { userId, chapterId } = req.body;

		if (!userId || !chapterId) {
			return res.status(400).json({
				success: false,
				message: "userId và chapterId là bắt buộc",
			});
		}

		const transaction = await AdminTransactionService.purchaseChapter(
			userId,
			chapterId,
		);

		return res.status(201).json({
			success: true,
			data: transaction,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Không thể mua chapter";

		return res.status(500).json({
			success: false,
			message,
		});
	}
};

// Lấy báo cáo doanh thu
export const getRevenueReport = async (req: Request, res: Response) => {
	try {
		const { dateRange = "today" } = req.query;

		const report = await AdminTransactionService.getRevenueReport(
			String(dateRange),
		);

		return res.status(200).json({
			success: true,
			data: report,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: "Không thể lấy báo cáo doanh thu";

		return res.status(500).json({
			success: false,
			message,
		});
	}
};
