import { Types } from "mongoose";
import type { IUser } from "../interfaces/user.js";
import { User } from "../models/User.js";

const PUBLIC_PROFILE_FIELDS =
  "username fullName nickName penName bio dob role email avatarURL backgroundURL vipLevel followersCount followingAuthorsCount followingStoriesCount storiesCount totalViews totalVotes spiritStones createdAt updatedAt";

const ALLOWED_UPDATE_FIELDS = [
  "fullName",
  "nickName",
  "penName",
  "dob",
  "avatarURL",
  "backgroundURL",
  "bio",
];

const UserService = {
  async getAllUsers() {
    try {
      const users = await User.find()
        .select("id fullName role nickName")
        .lean<IUser[]>();
      return users;
    } catch (error) {
      throw new Error(`Error fetching users: ${error}`);
    }
  },

  async getProfile(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const user = await User.findById(userId)
      .select(PUBLIC_PROFILE_FIELDS)
      .lean<IUser>();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  },

  async updateProfile(userId: string, profileData: Partial<IUser>) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const updateData: Partial<IUser> = {};

    for (const key of ALLOWED_UPDATE_FIELDS as (keyof IUser)[]) {
      if (profileData[key] !== undefined) {
        (updateData as Record<string, unknown>)[key] = profileData[key];
      }
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      },
    ).select(PUBLIC_PROFILE_FIELDS);

    if (!updated) {
      throw new Error("User not found");
    }

    return updated;
  },
};

export default UserService;
