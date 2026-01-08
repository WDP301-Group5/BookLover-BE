import { type IUser, User } from "../models/User.js";

const UserService = {
	async getAllUsers() {
		try {
			const users: IUser[] = await User.find().lean();
			return users;
		} catch (error) {
			throw new Error(`Error fetching users: ${error}`);
		}
	},
};

export default UserService;
