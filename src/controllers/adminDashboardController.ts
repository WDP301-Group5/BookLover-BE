import type { Request, Response } from "express";
import { AdminDashboardService } from "../services/adminDashboardService";

type GroupBy = "day" | "month" | "year";

export const AdminDashboardController = {
	async getOverview(req: Request, res: Response) {
		try {
			const groupBy = (req.query.groupBy as GroupBy) || "day";
			const data = await AdminDashboardService.getOverviewDashboard(groupBy);

			return res.status(200).json({
				success: true,
				message: "Lấy dashboard tổng quan thành công",
				data,
			});
		} catch (error: any) {
			console.error("getOverview dashboard error:", error);

			return res.status(500).json({
				success: false,
				message: "Lỗi khi lấy dashboard tổng quan",
				error: error.message,
			});
		}
	},
};
