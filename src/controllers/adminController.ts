import type { Request, Response } from "express";
import {
	ERR_BAD_REQUEST,
	ERR_FORBIDDEN,
	ERR_INTERNAL_SERVER,
	ERR_NOT_FOUND,
	ERR_RESOURCE_CONFLICT,
} from "../consts/errorCode.js";
import { SUCCESS_OK } from "../consts/successCode.js";
import AdminService from "../services/adminService.js";
import {
	createAdminSchema,
	updateAdminSchema,
} from "../utils/adminValidation.js";

/**
 * Lấy danh sách tất cả users
 */
export const getAllAdmins = async (
	_req: Request,
	res: Response,
): Promise<void> => {
	try {
		const users = await AdminService.getAllUsers();
		res.status(SUCCESS_OK).json({
			success: true,
			data: users,
		});
	} catch (error) {
		console.error("Error in getAllAdmins:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `An error occurred during getting all users! ${error}`,
		});
	}
};

/**
 * Lấy thông tin chi tiết 1 user theo ID
 */
export const getAdminById = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;
		const user = await AdminService.getUserById(id);

		res.status(SUCCESS_OK).json({
			success: true,
			data: user,
		});
	} catch (error) {
		console.error("Error in getAdminById:", error);
		if ((error as Error).message === "User not found") {
			res.status(ERR_NOT_FOUND).json({
				success: false,
				message: "User not found",
			});
		} else if ((error as Error).message === "Invalid user ID") {
			res.status(ERR_BAD_REQUEST).json({
				success: false,
				message: "Invalid user ID",
			});
		} else {
			res.status(ERR_INTERNAL_SERVER).json({
				success: false,
				message: `An error occurred during getting user! ${error}`,
			});
		}
	}
};

/**
 * Tạo mới user (admin)
 */
export const createAdmin = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		// Validate input
		const validatedData = createAdminSchema.parse(req.body);
		console.log(validatedData);

		// Tạo user
		const user = await AdminService.createUser(validatedData);

		res.status(SUCCESS_OK).json({
			success: true,
			message: "Created admin successfully",
			data: user,
		});
	} catch (error) {
		console.error("Error in createAdmin:", error);

		if (error instanceof Error) {
			if (error.name === "ZodError") {
				res.status(ERR_BAD_REQUEST).json({
					success: false,
					message: "Invalid input",
					errors: error,
				});
				return;
			}

			// Xử lý các lỗi trùng lặp
			if ((error as Error).message.includes("Email đã được sử dụng")) {
				res.status(ERR_RESOURCE_CONFLICT).json({
					success: false,
					message: "Email đã được sử dụng",
				});
				return;
			}

			if ((error as Error).message.includes("Username đã được sử dụng")) {
				res.status(ERR_RESOURCE_CONFLICT).json({
					success: false,
					message: "Username đã được sử dụng",
				});
				return;
			}
		}

		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `An error occurred during creating admin! ${error}`,
		});
	}
};

/**
 * Cập nhật thông tin user
 */
export const updateAdmin = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;

		// Validate input
		const validatedData = updateAdminSchema.parse(req.body);

		// Cập nhật user
		const user = await AdminService.updateUser(id, validatedData);

		res.status(SUCCESS_OK).json({
			success: true,
			message: "Updated admin successfully",
			data: user,
		});
	} catch (error) {
		console.error("Error in updateAdmin:", error);

		if (error instanceof Error) {
			if (error.name === "ZodError") {
				res.status(ERR_BAD_REQUEST).json({
					success: false,
					message: "Invalid input",
					errors: error,
				});
				return;
			}

			// Xử lý các lỗi cụ thể
			if ((error as Error).message === "User not found") {
				res.status(ERR_NOT_FOUND).json({
					success: false,
					message: "User not found",
				});
				return;
			}

			if ((error as Error).message === "Invalid user ID") {
				res.status(ERR_BAD_REQUEST).json({
					success: false,
					message: "Invalid user ID",
				});
				return;
			}

			if ((error as Error).message.includes("Username đã được sử dụng")) {
				res.status(ERR_RESOURCE_CONFLICT).json({
					success: false,
					message: "Username đã được sử dụng",
				});
				return;
			}
		}

		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `An error occurred during updating admin! ${error}`,
		});
	}
};

/**
 * Xóa 1 user
 */
export const deleteAdmin = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { id } = req.params;
		const currentUserId = req.user?.userId;

		// Prevent self-deletion
		if (id === currentUserId) {
			res.status(ERR_FORBIDDEN).json({
				success: false,
				message: "Cannot delete your own account",
			});
			return;
		}

		// Xóa user
		await AdminService.deleteUser(id);

		res.status(SUCCESS_OK).json({
			success: true,
			message: "Deleted admin successfully",
		});
	} catch (error) {
		console.error("Error in deleteAdmin:", error);

		if ((error as Error).message === "User not found") {
			res.status(ERR_NOT_FOUND).json({
				success: false,
				message: "User not found",
			});
		} else if ((error as Error).message === "Invalid user ID") {
			res.status(ERR_BAD_REQUEST).json({
				success: false,
				message: "Invalid user ID",
			});
		} else {
			res.status(ERR_INTERNAL_SERVER).json({
				success: false,
				message: `An error occurred during deleting admin! ${error}`,
			});
		}
	}
};

/**
 * Xóa nhiều users
 */
export const deleteManyAdmins = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { ids } = req.body;
		const currentUserId = req.user?.userId;

		if (!Array.isArray(ids) || ids.length === 0) {
			res.status(ERR_BAD_REQUEST).json({
				success: false,
				message: "User IDs array is required",
			});
			return;
		}

		// Prevent self-deletion
		if (ids.includes(currentUserId)) {
			res.status(ERR_FORBIDDEN).json({
				success: false,
				message: "Cannot delete your own account",
			});
			return;
		}

		// Xóa nhiều users
		const result = await AdminService.deleteManyUsers(ids);

		res.status(SUCCESS_OK).json({
			success: true,
			message: result.message,
			deletedCount: result.deletedCount,
		});
	} catch (error) {
		console.error("Error in deleteManyAdmins:", error);
		res.status(ERR_INTERNAL_SERVER).json({
			success: false,
			message: `An error occurred during deleting users! ${error}`,
		});
	}
};
