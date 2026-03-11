import { Types } from "mongoose";
import type { IUpdateUserData, IUser } from "../interfaces/user.js";
import { ReadingHistory } from "../models/ReadingHistory.js";
import { User } from "../models/User.js";
import { Story } from "../models/Story.js";
import { FollowAuthor } from "../models/FollowAuthor.js";
import { Chapter } from "../models/Chapter.js";

const PUBLIC_PROFILE_FIELDS =
  "username fullName nickName penName bio dob role email avatarURL backgroundURL vipLevel followersCount followingCount followingStoriesCount storiesCount totalViews totalVotes spiritStones createdAt updatedAt";

const PUBLIC_AUTHOR_FIELDS = `
    username fullName nickName penName bio
    avatarURL backgroundURL vipLevel
    followersCount followingCount followingStoriesCount storiesCount
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

const PAGE_SIZE = 20

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

  async getPublicProfile(currentUserId: string | undefined, profileUserId: string) {
    if (!Types.ObjectId.isValid(profileUserId)) {
      throw new Error("Invalid user ID");
    }

    const profileUser = await User.findById(profileUserId)
      .select(PUBLIC_AUTHOR_FIELDS)
      .lean();

    if (!profileUser) {
      throw new Error("User not found");
    }

    const stories = await Story.find({ authorId: profileUserId, status: "active" })
      .select(
        "title slug image description views stars rates followers isPremium isFinish createdAt updatedAt"
      )
      .lean();

    const storyIds = stories.map((s) => s._id);

    const chapterCounts = await Chapter.aggregate([
      { $match: { storyId: { $in: storyIds }, status: "active" } },
      { $group: { _id: "$storyId", chapterNumber: { $max: "$chapterNumber" } } },
    ]);

    const chapterMap: Record<string, number> = {};
    chapterCounts.forEach((c) => {
      chapterMap[c._id.toString()] = c.chapterNumber;
    });

    const storiesWithChapters = stories.map((story) => ({
      ...story,
      chapterNumber: chapterMap[story._id.toString()] || 0,
    }));

    const isSelf = currentUserId === profileUserId;

    let isFollowing = false;
    let followsMe = false;
    let isMutual = false;

    if (!isSelf && currentUserId) {
      const [viewerToProfile, profileToViewer] = await Promise.all([
        FollowAuthor.findOne({
          userId: currentUserId,
          authorId: profileUserId,
          status: "follow",
        }).lean(),
        FollowAuthor.findOne({
          userId: profileUserId,
          authorId: currentUserId,
          status: "follow",
        }).lean(),
      ]);

      isFollowing = !!viewerToProfile;
      followsMe = !!profileToViewer;
      isMutual = isFollowing && followsMe;
    }

    return {
      profile: {
        ...profileUser,
        storiesCount: storiesWithChapters.length,
        followingCount: profileUser.followingCount ?? 0,
        followersCount: profileUser.followersCount ?? 0,
      },
      stories: storiesWithChapters,
      relationship: {
        isSelf,
        amIFollowing: isFollowing,
        followsMe,
        isMutual,
      },
    };
  },

  async toggleFollow(userId: string, targetUserId: string) {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(targetUserId)) {
      throw new Error("Invalid user ID");
    }

    if (userId === targetUserId) {
      throw new Error("Cannot follow yourself");
    }

    const targetUser = await User.findById(targetUserId).lean();
    if (!targetUser) {
      throw new Error("Target user not found");
    }

    let existing = await FollowAuthor.findOne({
      userId,
      authorId: targetUserId,
    });

    let newStatus: "follow" | "unfollow";

    if (!existing) {
      existing = await FollowAuthor.create({
        userId,
        authorId: targetUserId,
        status: "follow",
      });
      newStatus = "follow";

      await Promise.all([
        User.findByIdAndUpdate(userId, { $inc: { followingCount: 1 } }),
        User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } }),
      ]);
    } else {
      if (existing.status === "follow") {
        existing.status = "unfollow";
        newStatus = "unfollow";

        await Promise.all([
          existing.save(),
          User.findByIdAndUpdate(userId, { $inc: { followingCount: -1 } }),
          User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: -1 } }),
        ]);
      } else {
        existing.status = "follow";
        newStatus = "follow";

        await Promise.all([
          existing.save(),
          User.findByIdAndUpdate(userId, { $inc: { followingCount: 1 } }),
          User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } }),
        ]);
      }
    }

    const reverseFollow = await FollowAuthor.findOne({
      userId: targetUserId,
      authorId: userId,
      status: "follow",
    }).lean();

    return {
      status: newStatus,
      relationship: {
        amIFollowing: newStatus === "follow",
        followsMe: !!reverseFollow,
        isMutual: newStatus === "follow" && !!reverseFollow,
      },
    };
  },

  async getFollowers(userId: string, page = 1, currentUserId?: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const skip = (page - 1) * PAGE_SIZE;

    const followerRecords = await FollowAuthor.find({
      authorId: userId,
      status: "follow",
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean();

    const followerIds = followerRecords.map((f) => f.userId.toString());

    if (followerIds.length === 0) {
      return {
        followers: [],
        total: 0,
        page,
        pageSize: PAGE_SIZE,
      };
    }

    const followers = await User.aggregate([
      {
        $match: {
          _id: { $in: followerIds.map((id) => new Types.ObjectId(id)) },
        },
      },
      {
        $lookup: {
          from: "stories",
          let: { authorId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$authorId", "$$authorId"] },
                    { $eq: ["$status", "active"] },
                  ],
                },
              },
            },
            { $count: "storiesCount" },
          ],
          as: "storiesInfo",
        },
      },
      {
        $addFields: {
          storiesCount: {
            $ifNull: [{ $arrayElemAt: ["$storiesInfo.storiesCount", 0] }, 0],
          },
        },
      },
      {
        $project: {
          storiesInfo: 0,
          password: 0,
          email: 0,
        },
      },
    ]);

    const followersMap = Object.fromEntries(
      followers.map((f) => [f._id.toString(), f])
    );

    const orderedFollowers = followerIds
      .map((id) => followersMap[id])
      .filter(Boolean);

    // currentUserId là người đang xem
    if (currentUserId && Types.ObjectId.isValid(currentUserId)) {
      const viewerFollowDocs = await FollowAuthor.find({
        userId: currentUserId,
        authorId: { $in: followerIds },
        status: "follow",
      }).lean();

      const viewerFollowMap = Object.fromEntries(
        viewerFollowDocs.map((f) => [f.authorId.toString(), true])
      );

      orderedFollowers.forEach((follower: any) => {
        const followsMe =
          currentUserId === userId
            ? true
            : false; // nếu currentUser đang xem chính list followers của mình thì item này chắc chắn follow mình

        const amIFollowing = !!viewerFollowMap[follower._id.toString()];

        follower.relationship = {
          amIFollowing,
          followsMe,
          isMutual: amIFollowing && followsMe,
        };
      });
    } else {
      orderedFollowers.forEach((follower: any) => {
        follower.relationship = {
          amIFollowing: false,
          followsMe: false,
          isMutual: false,
        };
      });
    }

    const total = await FollowAuthor.countDocuments({
      authorId: userId,
      status: "follow",
    });

    return {
      followers: orderedFollowers,
      total,
      page,
      pageSize: PAGE_SIZE,
    };
  },

  async getFollowing(userId: string, page = 1, currentUserId?: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const skip = (page - 1) * PAGE_SIZE;

    const followingRecords = await FollowAuthor.find({
      userId,
      status: "follow",
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean();

    const followingIds = followingRecords.map((f) => f.authorId.toString());

    if (followingIds.length === 0) {
      return {
        following: [],
        total: 0,
        page,
        pageSize: PAGE_SIZE,
      };
    }

    const following = await User.aggregate([
      {
        $match: {
          _id: { $in: followingIds.map((id) => new Types.ObjectId(id)) },
        },
      },
      {
        $lookup: {
          from: "stories",
          let: { authorId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$authorId", "$$authorId"] },
                    { $eq: ["$status", "active"] },
                  ],
                },
              },
            },
            { $count: "storiesCount" },
          ],
          as: "storiesInfo",
        },
      },
      {
        $addFields: {
          storiesCount: {
            $ifNull: [{ $arrayElemAt: ["$storiesInfo.storiesCount", 0] }, 0],
          },
        },
      },
      {
        $project: {
          storiesInfo: 0,
          password: 0,
          email: 0,
        },
      },
    ]);

    const followingMap = Object.fromEntries(
      following.map((f) => [f._id.toString(), f])
    );

    const orderedFollowing = followingIds
      .map((id) => followingMap[id])
      .filter(Boolean);

    if (currentUserId && Types.ObjectId.isValid(currentUserId)) {
      const reverseFollowDocs = await FollowAuthor.find({
        userId: { $in: followingIds },
        authorId: currentUserId,
        status: "follow",
      }).lean();

      const reverseFollowMap = Object.fromEntries(
        reverseFollowDocs.map((f) => [f.userId.toString(), true])
      );

      orderedFollowing.forEach((user: any) => {
        const amIFollowing =
          currentUserId === userId
            ? true
            : false; // nếu currentUser đang xem chính following của mình thì item này chắc chắn là mình đang follow

        const followsMe = !!reverseFollowMap[user._id.toString()];

        user.relationship = {
          amIFollowing,
          followsMe,
          isMutual: amIFollowing && followsMe,
        };
      });
    } else {
      orderedFollowing.forEach((user: any) => {
        user.relationship = {
          amIFollowing: false,
          followsMe: false,
          isMutual: false,
        };
      });
    }

    const total = await FollowAuthor.countDocuments({
      userId,
      status: "follow",
    });

    return {
      following: orderedFollowing,
      total,
      page,
      pageSize: PAGE_SIZE,
    };
  },
};

export default UserService;
