import mongoose from "mongoose";
import { User } from "../models/User.js";
import { UserAuth } from "../models/UserAuth.js";

type UserRole = "admin" | "author" | "user";
type UserStatus = "active" | "inactive" | "banned";

interface AdminListUsersParams {
	page?: number;
	limit?: number;
	keyword?: string;
	role?: UserRole;
	status?: UserStatus;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

interface AdminUpdateUserInput {
	fullName?: string;
	nickName?: string;
	penName?: string;
	email?: string;
	dob?: Date | string | null;
	bio?: string;
	role?: UserRole;
	status?: UserStatus;
	avatarURL?: string;
	backgroundURL?: string;
	vipLevel?: number;
}

class AdminUserService {
	private readonly NON_EDITABLE_FIELDS = [
		"username",
		"followersCount",
		"followingCount",
		"followingStoriesCount",
		"storiesCount",
		"totalViews",
		"totalVotes",
		"totalSpent",
		"spiritStones",
		"banReason",
		"bannedAt",
		"bannedBy",
		"online",
		"createdAt",
		"updatedAt",
		"_id",
	];

	private sanitizeUpdatePayload(payload: Record<string, unknown>) {
		const sanitized = { ...payload };

		for (const field of this.NON_EDITABLE_FIELDS) {
			delete sanitized[field];
		}

		return sanitized;
	}

	private normalizeEmail(email: string) {
		return email.toLowerCase().trim();
	}

	private buildKeywordQuery(keyword: string) {
		const regex = new RegExp(keyword.trim(), "i");
		return [
			{ username: regex },
			{ fullName: regex },
			{ nickName: regex },
			{ penName: regex },
			{ email: regex },
		];
	}

	private async refreshInactiveUsers(): Promise<void> {
		const now = new Date();
		const threeMonthsAgo = new Date(now);
		threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

		const staleAuthUsers = await UserAuth.find(
			{
				$or: [
					{ lastLoginAt: { $lt: threeMonthsAgo } },
					{ lastLoginAt: null },
					{ lastLoginAt: { $exists: false } },
				],
			},
			{ userId: 1, createdAt: 1, lastLoginAt: 1 },
		).lean();

		const inactiveUserIds: mongoose.Types.ObjectId[] = [];

		for (const auth of staleAuthUsers) {
			const referenceDate = auth.lastLoginAt ?? auth.createdAt;
			if (referenceDate && new Date(referenceDate) < threeMonthsAgo) {
				inactiveUserIds.push(auth.userId);
			}
		}

		if (inactiveUserIds.length > 0) {
			await User.updateMany(
				{
					_id: { $in: inactiveUserIds },
					status: { $ne: "banned" },
				},
				{ $set: { status: "inactive" } },
			);
		}

		const recentlyActiveAuthUsers = await UserAuth.find(
			{
				lastLoginAt: { $gte: threeMonthsAgo },
			},
			{ userId: 1 },
		).lean();

		const activeUserIds = recentlyActiveAuthUsers.map((item) => item.userId);

		if (activeUserIds.length > 0) {
			await User.updateMany(
				{
					_id: { $in: activeUserIds },
					status: "inactive",
				},
				{ $set: { status: "active" } },
			);
		}
	}

	async listUsers(params: AdminListUsersParams) {
		await this.refreshInactiveUsers();

		const page = Math.max(Number(params.page) || 1, 1);
		const limit = Math.max(Number(params.limit) || 10, 1);
		const skip = (page - 1) * limit;

		const sortBy = params.sortBy || "createdAt";
		const sortOrder = params.sortOrder === "asc" ? 1 : -1;

		const query: Record<string, unknown> = {};

		// Xử lý tìm kiếm theo từ khóa
		if (params.keyword?.trim()) {
			query.$or = this.buildKeywordQuery(params.keyword);
		}

		// Xử lý lọc theo vai trò
		if (params.role) {
			query.role = params.role;
		}

		// Xử lý lọc theo trạng thái
		if (params.status) {
			query.status = params.status;
		}

		const [users, total] = await Promise.all([
			User.find(query)
				.sort({ [sortBy]: sortOrder })
				.skip(skip)
				.limit(limit)
				.lean(),
			User.countDocuments(query),
		]);

		const userIds = users.map((user) => user._id);

		const authList = await UserAuth.find(
			{ userId: { $in: userIds } },
			{ userId: 1, provider: 1, lastLoginAt: 1, email: 1 },
		).lean();

		const authMap = new Map(
			authList.map((auth) => [String(auth.userId), auth]),
		);

		const items = users.map((user) => {
			const auth = authMap.get(String(user._id));

			return {
				...user,
				auth: {
					provider: auth?.provider ?? "local",
					lastLoginAt: auth?.lastLoginAt ?? null,
					authEmail: auth?.email ?? null,
				},
			};
		});

		return {
			items,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async getUserDetail(userId: string) {
		await this.refreshInactiveUsers();

		if (!mongoose.Types.ObjectId.isValid(userId)) {
			throw new Error("ID user không hợp lệ");
		}

		const user = await User.findById(userId)
			.populate("bannedBy", "username fullName email role")
			.lean();

		if (!user) {
			throw new Error("Không tìm thấy user");
		}

		const auth = await UserAuth.findOne(
			{ userId: user._id },
			{
				userId: 1,
				username: 1,
				email: 1,
				provider: 1,
				providerUserId: 1,
				lastLoginAt: 1,
				createdAt: 1,
				updatedAt: 1,
			},
		).lean();

		return {
			...user,
			auth: auth
				? {
						username: auth.username,
						email: auth.email,
						provider: auth.provider,
						providerUserId: auth.providerUserId,
						lastLoginAt: auth.lastLoginAt,
						createdAt: auth.createdAt,
						updatedAt: auth.updatedAt,
					}
				: null,
		};
	}

	async updateUser(
		userId: string,
		payload: AdminUpdateUserInput,
		adminId: string,
	) {
		if (!mongoose.Types.ObjectId.isValid(userId)) {
			throw new Error("ID user không hợp lệ");
		}

		if (!mongoose.Types.ObjectId.isValid(adminId)) {
			throw new Error("ID admin không hợp lệ");
		}

		const sanitized = this.sanitizeUpdatePayload(
			payload as Record<string, unknown>,
		) as AdminUpdateUserInput;

		if (Object.keys(sanitized).length === 0) {
			throw new Error("Không có dữ liệu hợp lệ để cập nhật");
		}

		const existingUser = await User.findById(userId);
		if (!existingUser) {
			throw new Error("Không tìm thấy user");
		}

		if (sanitized.status === "banned") {
			throw new Error("Không dùng API update chung để ban user");
		}

		if (
			String(existingUser._id) === adminId &&
			sanitized.role &&
			sanitized.role !== "admin"
		) {
			throw new Error("Admin không thể tự đổi role của chính mình");
		}

		if (sanitized.email) {
			const normalizedEmail = this.normalizeEmail(sanitized.email);

			const duplicatedUser = await User.findOne({
				email: normalizedEmail,
				_id: { $ne: userId },
			}).lean();

			if (duplicatedUser) {
				throw new Error("Email đã tồn tại trong User");
			}

			const duplicatedAuth = await UserAuth.findOne({
				email: normalizedEmail,
				userId: { $ne: userId },
			}).lean();

			if (duplicatedAuth) {
				throw new Error("Email đã tồn tại trong UserAuth");
			}

			sanitized.email = normalizedEmail;
		}

		const session = await mongoose.startSession();

		try {
			let updatedUser: unknown = null;

			await session.withTransaction(async () => {
				updatedUser = await User.findByIdAndUpdate(
					userId,
					{ $set: sanitized },
					{ new: true, runValidators: true, session },
				).lean();

				if (sanitized.email) {
					await UserAuth.findOneAndUpdate(
						{ userId },
						{ $set: { email: sanitized.email } },
						{ new: true, runValidators: true, session },
					);
				}
			});

			return updatedUser;
		} finally {
			await session.endSession();
		}
	}

	async banUser(userId: string, adminId: string, banReason: string) {
		if (!mongoose.Types.ObjectId.isValid(userId)) {
			throw new Error("ID user không hợp lệ");
		}

		if (!mongoose.Types.ObjectId.isValid(adminId)) {
			throw new Error("ID admin không hợp lệ");
		}

		if (!banReason?.trim()) {
			throw new Error("Lý do khóa tài khoản là bắt buộc");
		}

		if (userId === adminId) {
			throw new Error("Admin không thể tự khóa chính mình");
		}

		const user = await User.findById(userId);
		if (!user) {
			throw new Error("Không tìm thấy user");
		}

		if (user.status === "banned") {
			throw new Error("User này đã bị khóa trước đó");
		}

		user.status = "banned";
		user.banReason = banReason.trim();
		user.bannedAt = new Date();
		user.bannedBy = new mongoose.Types.ObjectId(adminId);

		await user.save();

		return user;
	}

	async unbanUser(userId: string) {
		if (!mongoose.Types.ObjectId.isValid(userId)) {
			throw new Error("ID user không hợp lệ");
		}

		const user = await User.findById(userId);
		if (!user) {
			throw new Error("Không tìm thấy user");
		}

		if (user.status !== "banned") {
			throw new Error("User này không ở trạng thái banned");
		}

		user.status = "active";
		user.banReason = "";
		user.bannedAt = null;
		user.bannedBy = null;

		await user.save();

		return user;
	}

	async updateUserStatus(userId: string, status: "active" | "inactive") {
		if (!mongoose.Types.ObjectId.isValid(userId)) {
			throw new Error("ID user không hợp lệ");
		}

		const user = await User.findById(userId);
		if (!user) {
			throw new Error("Không tìm thấy user");
		}

		if (user.status === "banned") {
			throw new Error("User đang bị banned, hãy unban trước");
		}

		user.status = status;
		await user.save();

		return user;
	}

	async updateUserRole(userId: string, role: UserRole, adminId: string) {
		if (!mongoose.Types.ObjectId.isValid(userId)) {
			throw new Error("ID user không hợp lệ");
		}

		if (!mongoose.Types.ObjectId.isValid(adminId)) {
			throw new Error("ID admin không hợp lệ");
		}

		const user = await User.findById(userId);
		if (!user) {
			throw new Error("Không tìm thấy user");
		}

		if (String(user._id) === adminId && role !== "admin") {
			throw new Error("Admin không thể tự đổi role của chính mình");
		}

		user.role = role;
		await user.save();

		return user;
	}
}

export const adminUserService = new AdminUserService();
