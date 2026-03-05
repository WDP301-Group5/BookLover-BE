import { Types } from "mongoose";
import { User } from "../models/User.js";
import { UserAuth } from "../models/UserAuth.js";
import type {
	CreateAdminInput,
	UpdateAdminInput,
} from "../utils/adminValidation.js";

const PUBLIC_USER_FIELDS =
	"_id email username fullName nickName penName role status dob avatarURL backgroundURL vipLevel spiritStones totalSpent totalViews totalVotes createdAt updatedAt";

const AdminService = {
	/**
	 * Lấy danh sách tất cả users
	 */
	async getAllUsers() {
		try {
			const users = await User.find({
				role: "admin",
			})
				.select(PUBLIC_USER_FIELDS)
				.lean();
			return users;
		} catch (error) {
			throw new Error(`Error fetching users: ${error}`);
		}
	},

	/**
	 * Lấy thông tin chi tiết 1 user theo ID
	 */
	async getUserById(userId: string) {
		try {
			if (!Types.ObjectId.isValid(userId)) {
				throw new Error("Invalid user ID");
			}

			const user = await User.findById(userId).select(PUBLIC_USER_FIELDS);

			if (!user) {
				throw new Error("User not found");
			}

			return user;
		} catch (error) {
			throw new Error(`Error fetching user: ${error}`);
		}
	},

	/**
	 * Tạo mới user (admin)
	 */
	async createUser(data: CreateAdminInput) {
		try {
			const {
				email,
				password,
				username,
				fullName,
				nickName,
				penName,
				dob,
				role,
				status,
			} = data;

			const emailLower = email.toLowerCase().trim();

			// Kiểm tra email đã tồn tại
			const existingAuth = await UserAuth.findOne({ email: emailLower });
			if (existingAuth) {
				throw new Error("Email đã được sử dụng");
			}

			// Kiểm tra username đã tồn tại
			const existingUsername = await UserAuth.findOne({
				username: username.trim(),
			});
			if (existingUsername) {
				throw new Error("Username đã được sử dụng");
			}

			// Tạo User (chú ý username bắt buộc trong schema)
			const user = await User.create({
				username: username.trim(),
				fullName,
				email: emailLower,
				role: role || "admin",
				status: status || "active",
				nickName: nickName || "",
				penName: penName || "",
				dob: dob ? new Date(dob) : undefined,
				avatarURL: "",
				vipLevel: 0,
				spiritStones: 0,
				totalSpent: 0,
			});

			// Tạo UserAuth với password (pre-save hook sẽ hash password)
			await UserAuth.create({
				userId: user._id,
				email: emailLower,
				username: username.trim(),
				provider: "local",
				password: password,
			});

			// Trả về thông tin user vừa tạo
			return await this.getUserById(user._id.toString());
		} catch (error) {
			throw new Error(`Error creating user: ${error}`);
		}
	},

	/**
	 * Cập nhật thông tin user
	 */
	async updateUser(userId: string, data: UpdateAdminInput) {
		try {
			if (!Types.ObjectId.isValid(userId)) {
				throw new Error("Invalid user ID");
			}

			// Kiểm tra user tồn tại
			const existingUser = await User.findById(userId);
			if (!existingUser) {
				throw new Error("User not found");
			}

			// Kiểm tra username không được trùng (nếu có thay đổi)
			if (data.username && data.username.trim() !== existingUser.nickName) {
				const existingUsername = await UserAuth.findOne({
					username: data.username.trim(),
					userId: { $ne: new Types.ObjectId(userId) },
				});
				if (existingUsername) {
					throw new Error("Username đã được sử dụng");
				}
			}

			// Cập nhật User
			const updateData: Partial<typeof User.prototype> = {};

			if (data.fullName !== undefined) updateData.fullName = data.fullName;
			if (data.nickName !== undefined) updateData.nickName = data.nickName;
			if (data.penName !== undefined) updateData.penName = data.penName;
			if (data.dob !== undefined) updateData.dob = new Date(data.dob);
			if (data.role !== undefined) updateData.role = data.role;
			if (data.status !== undefined) updateData.status = data.status;

			const updatedUser = await User.findByIdAndUpdate(
				userId,
				{ $set: updateData },
				{ new: true, runValidators: true },
			);

			if (!updatedUser) {
				throw new Error("User not found");
			}

			// Cập nhật UserAuth (username, password nếu có)
			const authUpdateData: Partial<typeof UserAuth.prototype> = {};

			if (data.username !== undefined) {
				authUpdateData.username = data.username.trim();
			}

			// Xử lý đổi mật khẩu
			if (data.changePassword && data.newPassword) {
				// Import hashPassword từ utils
				const { hashPassword } = await import("../utils/hashPassword.js");
				authUpdateData.password = hashPassword(data.newPassword);
			}

			if (Object.keys(authUpdateData).length > 0) {
				await UserAuth.findOneAndUpdate(
					{ userId: new Types.ObjectId(userId) },
					{ $set: authUpdateData },
					{ new: true, runValidators: true },
				);
			}

			return await this.getUserById(userId);
		} catch (error) {
			throw new Error(`Error updating user: ${error}`);
		}
	},

	/**
	 * Xóa 1 user (kèm UserAuth)
	 */
	async deleteUser(userId: string) {
		try {
			if (!Types.ObjectId.isValid(userId)) {
				throw new Error("Invalid user ID");
			}

			// Kiểm tra user tồn tại
			const user = await User.findById(userId);
			if (!user) {
				throw new Error("User not found");
			}

			// Xóa UserAuth trước
			await UserAuth.deleteOne({ userId: new Types.ObjectId(userId) });

			// Xóa User
			await User.findByIdAndDelete(userId);

			return { success: true, message: "User deleted successfully" };
		} catch (error) {
			throw new Error(`Error deleting user: ${error}`);
		}
	},

	/**
	 * Xóa nhiều users (kèm UserAuth)
	 */
	async deleteManyUsers(userIds: string[]) {
		try {
			// Validate tất cả IDs
			const validIds = userIds.filter((id) => Types.ObjectId.isValid(id));

			if (validIds.length === 0) {
				throw new Error("No valid user IDs provided");
			}

			const objectIds = validIds.map((id) => new Types.ObjectId(id));

			// Xóa UserAuth của tất cả users
			await UserAuth.deleteMany({ userId: { $in: objectIds } });

			// Xóa Users
			const result = await User.deleteMany({ _id: { $in: objectIds } });

			return {
				success: true,
				message: `Deleted ${result.deletedCount} users successfully`,
				deletedCount: result.deletedCount,
			};
		} catch (error) {
			throw new Error(`Error deleting users: ${error}`);
		}
	},
};

export default AdminService;
