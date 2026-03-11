import { z } from "zod";

/**
 * Schema để tạo mới một admin/user
 */
export const createAdminSchema = z
	.object({
		email: z.string().email("Email không hợp lệ"),
		password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
		confirmPassword: z.string(),
		username: z.string().min(3, "Username phải có ít nhất 3 ký tự"),
		fullName: z.string().min(1, "Họ tên không được để trống"),
		nickName: z.string().optional(),
		penName: z.string().optional(),
		dob: z.string().optional(),
		role: z.enum(["admin", "author", "user"]).default("admin"),
		status: z.enum(["active", "inactive", "banned"]).default("active"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Mật khẩu xác nhận không khớp",
		path: ["confirmPassword"],
	});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;

/**
 * Schema để cập nhật thông tin user
 */
export const updateAdminSchema = z
	.object({
		username: z.string().min(3).optional(),
		fullName: z.string().min(1).optional(),
		nickName: z.string().optional(),
		penName: z.string().optional(),
		dob: z.string().optional(),
		role: z.enum(["admin", "author", "user"]).optional(),
		status: z.enum(["active", "inactive", "banned"]).optional(),
		changePassword: z.boolean().optional(),
		newPassword: z.string().min(8).optional(),
		confirmPassword: z.string().optional(),
	})
	.refine(
		(data) => {
			// Nếu có changePassword = true thì phải có newPassword và confirmPassword
			if (data.changePassword) {
				return (
					data.newPassword !== undefined && data.confirmPassword !== undefined
				);
			}
			return true;
		},
		{
			message: "Vui lòng nhập mật khẩu mới và xác nhận mật khẩu",
			path: ["newPassword"],
		},
	)
	.refine(
		(data) => {
			// Nếu có changePassword = true thì newPassword và confirmPassword phải khớp
			if (data.changePassword) {
				return data.newPassword === data.confirmPassword;
			}
			return true;
		},
		{
			message: "Mật khẩu xác nhận không khớp",
			path: ["confirmPassword"],
		},
	);

export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
