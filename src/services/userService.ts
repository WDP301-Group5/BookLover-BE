import { Types } from "mongoose";
import type { IUpdateUserData, IUser } from "../interfaces/user.js";
import { ReadingHistory } from "../models/ReadingHistory.js";
import { User } from "../models/User.js";

const PUBLIC_PROFILE_FIELDS =
  "username fullName nickName penName bio dob role email avatarURL backgroundURL vipLevel followersCount followingAuthorsCount followingStoriesCount storiesCount totalViews totalVotes spiritStones createdAt updatedAt";

const ALLOWED_UPDATE_FIELDS = [
  "fullName",
  "username",
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

  async updateProfile(userId: string, profileData: Partial<IUpdateUserData>) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const updateData: Partial<IUpdateUserData> = {};

    for (const key of ALLOWED_UPDATE_FIELDS as (keyof IUpdateUserData)[]) {
      if (profileData[key] !== undefined) {
        updateData[key] = profileData[key];
      }
    }

    if (updateData.username) {
      const existing = await User.findOne({
        username: updateData.username,
        _id: { $ne: userId },
      });

      if (existing) {
        throw new Error("Username đã tồn tại");
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

  async saveHistory(userId: string, storyId: string, newChapterNumber: number) {
    try {
      const userHistory = await ReadingHistory.findOne({ userId, storyId });
      if (userHistory) {
        if (newChapterNumber > userHistory.chapterNumber) {
          userHistory.chapterNumber = newChapterNumber;
          await userHistory.save();
        }
        return userHistory;
      }
      const newHistory = new ReadingHistory({
        userId,
        storyId,
        chapterNumber: newChapterNumber,
      });
      await newHistory.save();
      return newHistory;
    } catch (error) {
      throw new Error(`Error adding new reading history: ${error}`);
    }
  },

  async checkUserStone(userId: string) {
    const user = await User.findById(userId).select("spiritStones").lean();
    if (!user) {
      return null;
    }
    return user.spiritStones;
  },

  async searchUsers(query: string) {
    if (!query || query.trim() === "") {
      return [];
    }

    // Tìm user dựa trên username hoặc penName, không phân biệt hoa/thường
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { penName: { $regex: query, $options: "i" } },
      ],
    })
      .select("id username penName fullName role")
      .lean<IUser[]>();

    return users;
  }
};

export default UserService;
