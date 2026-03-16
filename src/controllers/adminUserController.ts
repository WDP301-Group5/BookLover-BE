import type { Request, Response } from "express";
import { adminUserService } from "../services/adminUserService";

class AdminUserController {
	async listUsers(req: Request, res: Response) {
		try {
			const data = await adminUserService.listUsers({
				page: Number(req.query.page) || 1,
				limit: Number(req.query.limit) || 10,
				keyword: req.query.keyword as string,
				role: req.query.role as "admin" | "author" | "user",
				status: req.query.status as "active" | "inactive" | "banned",
				sortBy: req.query.sortBy as string,
				sortOrder: req.query.sortOrder as "asc" | "desc",
			});

			res.status(200).json({
				message: "Lấy danh sách user thành công",
				data,
			});
		} catch (error) {
			res.status(400).json({
				message: (error as Error).message,
			});
		}
	}

	async getUserDetail(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const data = await adminUserService.getUserDetail(id);

			res.status(200).json({
				message: "Lấy chi tiết user thành công",
				data,
			});
		} catch (error) {
			res.status(404).json({
				message: (error as Error).message,
			});
		}
	}

	async updateUser(req: Request, res: Response) {
		try {
			const { id } = req.params;

			if (!req.user?.userId) {
				res.status(401).json({ message: "Bạn chưa đăng nhập" });
				return;
			}

			const data = await adminUserService.updateUser(id, req.body, req.user.userId);

			res.status(200).json({
				message: "Cập nhật user thành công",
				data,
			});
		} catch (error) {
			res.status(400).json({
				message: (error as Error).message,
			});
		}
	}

	async banUser(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { banReason } = req.body;

			if (!req.user?.userId) {
				res.status(401).json({ message: "Bạn chưa đăng nhập" });
				return;
			}

			const data = await adminUserService.banUser(id, req.user.userId, banReason);

			res.status(200).json({
				message: "Khóa user thành công",
				data,
			});
		} catch (error) {
			res.status(400).json({
				message: (error as Error).message,
			});
		}
	}

	async unbanUser(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const data = await adminUserService.unbanUser(id);

			res.status(200).json({
				message: "Mở khóa user thành công",
				data,
			});
		} catch (error) {
			res.status(400).json({
				message: (error as Error).message,
			});
		}
	}

	async updateUserStatus(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { status } = req.body;

			if (!["active", "inactive"].includes(status)) {
				res.status(400).json({
					message: "Status chỉ được là active hoặc inactive",
				});
				return;
			}

			const data = await adminUserService.updateUserStatus(id, status);

			res.status(200).json({
				message: "Cập nhật trạng thái user thành công",
				data,
			});
		} catch (error) {
			res.status(400).json({
				message: (error as Error).message,
			});
		}
	}

	async updateUserRole(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { role } = req.body;

			if (!req.user?.userId) {
				res.status(401).json({ message: "Bạn chưa đăng nhập" });
				return;
			}

			if (!["admin", "author", "user"].includes(role)) {
				res.status(400).json({
					message: "Role không hợp lệ",
				});
				return;
			}

			const data = await adminUserService.updateUserRole(id, role, req.user.userId);

			res.status(200).json({
				message: "Cập nhật role thành công",
				data,
			});
		} catch (error) {
			res.status(400).json({
				message: (error as Error).message,
			});
		}
	}
}

export const adminUserController = new AdminUserController();