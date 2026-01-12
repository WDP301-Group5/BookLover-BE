import type { JwtPayload } from "../interfaces/jwtPayload.js";
import { User } from "../models/User.js";

const UserService = {
	async getAllUsers() {
		try {
			const users: JwtPayload[] = await User.find()
				.select("id fullName role nickName")
				.lean();
			return users;
		} catch (error) {
			throw new Error(`Error fetching users: ${error}`);
		}
	},
};

export default UserService;
