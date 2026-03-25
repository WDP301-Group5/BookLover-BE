import { z } from "zod";

export const registerSchema = z
	.object({
		name: z.string().min(1, "Name is required"),
		email: z.email("Invalid email format"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z
			.string()
			.min(8, "Confirm password must be at least 8 characters"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
	account: z
		.string()
		.min(1, "Email hoặc username là bắt buộc")
		.refine((value) => {
			const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
			const isUsername = /^[a-z0-9_]{3,20}$/.test(value);
			return isEmail || isUsername;
		}, "Vui lòng nhập email hoặc username hợp lệ"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const googleLoginSchema = z.object({
	token: z.string().min(1, "Google token is required"),
	rememberMe: z.boolean().optional(),
});

export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;

export const passwordResetRequestSchema = z.object({
	email: z.email("Invalid email format"),
});

export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetConfirmSchema = z
	.object({
		token: z.string().min(1, "Token is required"),
		newPassword: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z
			.string()
			.min(8, "Confirm password must be at least 8 characters"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type PasswordResetConfirm = z.infer<typeof passwordResetConfirmSchema>;

export const slugify = (str: string) =>
	str
		.toLowerCase()
		.normalize("NFD") // tách dấu tiếng Việt
		.replace(/[\u0300-\u036f]/g, "") // xóa dấu
		.replace(/đ/g, "d") // xử lý riêng chữ đ
		.replace(/[^a-z0-9\s-]/g, "") // xóa ký tự đặc biệt
		.trim()
		.replace(/\s+/g, "-") // khoảng trắng -> -
		.replace(/-+/g, "-"); // xóa --;
