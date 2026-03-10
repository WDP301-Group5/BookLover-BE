import { Types } from "mongoose";
import type { IUpdateUserData, IUser } from "../interfaces/user.js";
import { ReadingHistory } from "../models/ReadingHistory.js";
import { User } from "../models/User.js";
import { Story } from "../models/Story.js";
import { FollowAuthor } from "../models/FollowAuthor.js";

const PUBLIC_PROFILE_FIELDS =
  "username fullName nickName penName bio dob role email avatarURL backgroundURL vipLevel followersCount followingAuthorsCount followingStoriesCount storiesCount totalViews totalVotes spiritStones createdAt updatedAt";

const PUBLIC_AUTHOR_FIELDS = `
    username fullName nickName penName bio
    avatarURL backgroundURL vipLevel
    followersCount followingAuthorsCount followingStoriesCount storiesCount
    totalViews totalVotes
    createdAt updatedAt
  `;

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
  },

  async getPublicProfile(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const author = await User.findById(userId)
      .select(PUBLIC_AUTHOR_FIELDS)
      .lean();

    if (!author) {
      throw new Error("Author not found");
    }

    const stories = await Story.find({ authorId: userId, status: "active" })
      .select(
        "title slug image description views stars rates followers isPremium isFinish createdAt updatedAt"
      )
      .lean();

    const followingCount = await FollowAuthor.countDocuments({
      userId: userId,
      status: "follow",
    });

    const followersCount = await FollowAuthor.countDocuments({
      authorId: userId,
      status: "follow",
    });

    return {
      ...author,
      stories,
      followingCount,
      followersCount,
    };
  },

  async toggleFollow(userId: string, authorId: string) {
    if (userId === authorId) throw new Error("Cannot follow yourself");

    let existing = await FollowAuthor.findOne({ userId, authorId });

    let newStatus: "follow" | "unfollow";
    if (!existing) {
      existing = await FollowAuthor.create({ userId, authorId, status: "follow" });
      newStatus = "follow";
    } else {
      existing.status = existing.status === "follow" ? "unfollow" : "follow";
      await existing.save();
      newStatus = existing.status;
    }

    // Update số lượng followers/following trong User
    const followersCount = await FollowAuthor.countDocuments({
      authorId,
      status: "follow",
    });
    const followingCount = await FollowAuthor.countDocuments({
      userId,
      status: "follow",
    });

    await User.findByIdAndUpdate(authorId, { followersCount });
    await User.findByIdAndUpdate(userId, { followingAuthorsCount: followingCount });

    return { status: newStatus, followersCount, followingCount };
  },

  // Kiểm tra trạng thái follow giữa 2 người
  async checkFollowStatus(userId: string, authorId: string) {
    const existing = await FollowAuthor.findOne({ userId, authorId });
    if (!existing) return "unfollow";
    return existing.status;
  },
};

export default UserService;
