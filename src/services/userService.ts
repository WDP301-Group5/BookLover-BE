import mongoose, { Types } from "mongoose";
import type { IUpdateUserData, IUser } from "../interfaces/user.js";
import { ReadingHistory } from "../models/ReadingHistory.js";
import { User } from "../models/User.js";
import { Story } from "../models/Story.js";
import { FollowAuthor } from "../models/FollowAuthor.js";
import { Chapter } from "../models/Chapter.js";
import notificationService from "./notificationService.js";

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

const PAGE_SIZE = 20;

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

    const [followersCount, followingCount, storiesCount] = await Promise.all([
      FollowAuthor.countDocuments({
        authorId: userId,
        status: "follow",
      }),
      FollowAuthor.countDocuments({
        userId,
        status: "follow",
      }),
      Story.countDocuments({
          authorId: userId,
      }),
    ]);

    return {
      ...user,
      followersCount,
      followingCount,
      storiesCount,
    };
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

  async searchUsers(query: string, currentUserId?: string) {
    if (!query || query.trim() === "") {
      return [];
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { penName: { $regex: query, $options: "i" } },
      ],
    })
      .select("_id username penName fullName role avatarURL")
      .lean();

    if (!currentUserId || !Types.ObjectId.isValid(currentUserId) || users.length === 0) {
      return users.map((user: any) => ({
        ...user,
        relationship: {
          isSelf: false,
          amIFollowing: false,
          followsMe: false,
          isMutual: false,
          notificationEnabled: false,
        },
      }));
    }

    const targetUserIds = users.map((u: any) => u._id.toString());

    const [myFollowDocs, reverseFollowDocs] = await Promise.all([
      FollowAuthor.find({
        userId: currentUserId,
        authorId: { $in: targetUserIds },
        status: { $in: ["follow", "unsend"] },
      }).lean(),
      FollowAuthor.find({
        userId: { $in: targetUserIds },
        authorId: currentUserId,
        status: { $in: ["follow", "unsend"] },
      }).lean(),
    ]);

    const myFollowMap = Object.fromEntries(
      myFollowDocs.map((doc) => [
        doc.authorId.toString(),
        {
          isFollowing: true,
          notificationEnabled: doc.status === "follow",
        },
      ])
    );

    const reverseFollowMap = Object.fromEntries(
      reverseFollowDocs.map((doc) => [doc.userId.toString(), true])
    );

    return users.map((user: any) => {
      const userId = user._id.toString();
      const isSelf = userId === currentUserId;
      const myFollowInfo = myFollowMap[userId];

      const amIFollowing = isSelf ? false : !!myFollowInfo?.isFollowing;
      const followsMe = isSelf ? false : !!reverseFollowMap[userId];
      const notificationEnabled = isSelf ? false : !!myFollowInfo?.notificationEnabled;

      return {
        ...user,
        relationship: {
          isSelf,
          amIFollowing,
          followsMe,
          isMutual: amIFollowing && followsMe,
          notificationEnabled,
        },
      };
    });
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

    const stories = await Story.find({ authorId: profileUserId })
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

    const [followersCount, followingCount] = await Promise.all([
      FollowAuthor.countDocuments({
        authorId: profileUserId,
        status: "follow",
      }),
      FollowAuthor.countDocuments({
        userId: profileUserId,
        status: "follow",
      }),
    ]);

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
        followingCount,
        followersCount,
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

    const session = await mongoose.startSession();

    try {
      let result: {
        status: "follow" | "unfollow";
        relationship: {
          amIFollowing: boolean;
          followsMe: boolean;
          isMutual: boolean;
        };
        shouldNotify: boolean;
        followerUsername: string;
      } | null = null;

      await session.withTransaction(async () => {
        const [currentUser, targetUser] = await Promise.all([
          User.findById(userId).select("username fullName").session(session).lean(),
          User.findById(targetUserId).select("_id").session(session).lean(),
        ]);

        if (!currentUser) {
          throw new Error("Current user not found");
        }

        if (!targetUser) {
          throw new Error("Target user not found");
        }

        let followDoc = await FollowAuthor.findOne({
          userId,
          authorId: targetUserId,
        }).session(session);

        let newStatus: "follow" | "unfollow";
        let countDelta = 0;
        let shouldNotify = false;

        if (!followDoc) {
          followDoc = await FollowAuthor.create(
            [
              {
                userId,
                authorId: targetUserId,
                status: "follow",
              },
            ],
            { session },
          ).then((docs) => docs[0]);

          newStatus = "follow";
          countDelta = 1;
          shouldNotify = true;
        } else if (followDoc.status === "follow") {
          followDoc.status = "unfollow";
          await followDoc.save({ session });

          newStatus = "unfollow";
          countDelta = -1;
        } else {
          followDoc.status = "follow";
          await followDoc.save({ session });

          newStatus = "follow";
          countDelta = 1;
          shouldNotify = true;
        }

        if (countDelta !== 0) {
          await Promise.all([
            User.findByIdAndUpdate(
              userId,
              { $inc: { followingCount: countDelta } },
              { session },
            ),
            User.findByIdAndUpdate(
              targetUserId,
              { $inc: { followersCount: countDelta } },
              { session },
            ),
          ]);
        }

        const reverseFollow = await FollowAuthor.findOne({
          userId: targetUserId,
          authorId: userId,
          status: "follow",
        })
          .session(session)
          .lean();

        result = {
          status: newStatus,
          relationship: {
            amIFollowing: newStatus === "follow",
            followsMe: !!reverseFollow,
            isMutual: newStatus === "follow" && !!reverseFollow,
          },
          shouldNotify,
          followerUsername: currentUser.username,
        };
      });

      if (!result) {
        throw new Error("Toggle follow failed");
      }

      if (result.shouldNotify && result.status === "follow") {
        await notificationService.notifyUserFollowed({
          followerId: userId,
          followingId: targetUserId,
          followerUsername: result.followerUsername,
        });
      }

      return {
        status: result.status,
        relationship: result.relationship,
      };
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new Error("Quan hệ follow đã tồn tại, vui lòng thử lại");
      }
      throw new Error(error?.message || "Toggle follow failed");
    } finally {
      await session.endSession();
    }
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

    const followerObjectIds = followerIds.map((id) => new Types.ObjectId(id));

    const followers = await User.aggregate([
      {
        $match: {
          _id: { $in: followerObjectIds },
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

    // ===== TÍNH LẠI followersCount / followingCount THẬT =====
    const [followersAgg, followingAgg] = await Promise.all([
      FollowAuthor.aggregate([
        {
          $match: {
            authorId: { $in: followerObjectIds },
            status: "follow",
          },
        },
        {
          $group: {
            _id: "$authorId",
            count: { $sum: 1 },
          },
        },
      ]),
      FollowAuthor.aggregate([
        {
          $match: {
            userId: { $in: followerObjectIds },
            status: "follow",
          },
        },
        {
          $group: {
            _id: "$userId",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const followersCountMap = Object.fromEntries(
      followersAgg.map((item) => [item._id.toString(), item.count])
    );

    const followingCountMap = Object.fromEntries(
      followingAgg.map((item) => [item._id.toString(), item.count])
    );

    orderedFollowers.forEach((follower: any) => {
      const id = follower._id.toString();
      follower.followersCount = followersCountMap[id] ?? 0;
      follower.followingCount = followingCountMap[id] ?? 0;
    });

    if (currentUserId && Types.ObjectId.isValid(currentUserId)) {
      const [viewerFollowDocs, reverseFollowDocs] = await Promise.all([
        FollowAuthor.find({
          userId: currentUserId,
          authorId: { $in: followerIds },
          status: "follow",
        }).lean(),
        FollowAuthor.find({
          userId: { $in: followerIds },
          authorId: currentUserId,
          status: "follow",
        }).lean(),
      ]);

      const viewerFollowMap = Object.fromEntries(
        viewerFollowDocs.map((f) => [f.authorId.toString(), true])
      );

      const reverseFollowMap = Object.fromEntries(
        reverseFollowDocs.map((f) => [f.userId.toString(), true])
      );

      orderedFollowers.forEach((follower: any) => {
        const followerId = follower._id.toString();
        const isSelf = followerId === currentUserId;

        const amIFollowing = isSelf ? false : !!viewerFollowMap[followerId];
        const followsMe = isSelf ? false : !!reverseFollowMap[followerId];

        follower.relationship = {
          isSelf,
          amIFollowing,
          followsMe,
          isMutual: amIFollowing && followsMe,
        };
      });
    } else {
      orderedFollowers.forEach((follower: any) => {
        follower.relationship = {
          isSelf: false,
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

    const followingObjectIds = followingIds.map((id) => new Types.ObjectId(id));

    const following = await User.aggregate([
      {
        $match: {
          _id: { $in: followingObjectIds },
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

    // ===== TÍNH LẠI followersCount / followingCount THẬT =====
    const [followersAgg, followingAgg] = await Promise.all([
      FollowAuthor.aggregate([
        {
          $match: {
            authorId: { $in: followingObjectIds },
            status: "follow",
          },
        },
        {
          $group: {
            _id: "$authorId",
            count: { $sum: 1 },
          },
        },
      ]),
      FollowAuthor.aggregate([
        {
          $match: {
            userId: { $in: followingObjectIds },
            status: "follow",
          },
        },
        {
          $group: {
            _id: "$userId",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const followersCountMap = Object.fromEntries(
      followersAgg.map((item) => [item._id.toString(), item.count])
    );

    const followingCountMap = Object.fromEntries(
      followingAgg.map((item) => [item._id.toString(), item.count])
    );

    orderedFollowing.forEach((targetUser: any) => {
      const id = targetUser._id.toString();
      targetUser.followersCount = followersCountMap[id] ?? 0;
      targetUser.followingCount = followingCountMap[id] ?? 0;
    });

    if (currentUserId && Types.ObjectId.isValid(currentUserId)) {
      const [viewerFollowDocs, reverseFollowDocs] = await Promise.all([
        FollowAuthor.find({
          userId: currentUserId,
          authorId: { $in: followingIds },
          status: "follow",
        }).lean(),
        FollowAuthor.find({
          userId: { $in: followingIds },
          authorId: currentUserId,
          status: "follow",
        }).lean(),
      ]);

      const viewerFollowMap = Object.fromEntries(
        viewerFollowDocs.map((f) => [f.authorId.toString(), true])
      );

      const reverseFollowMap = Object.fromEntries(
        reverseFollowDocs.map((f) => [f.userId.toString(), true])
      );

      orderedFollowing.forEach((targetUser: any) => {
        const targetId = targetUser._id.toString();
        const isSelf = targetId === currentUserId;

        const amIFollowing = isSelf ? false : !!viewerFollowMap[targetId];
        const followsMe = isSelf ? false : !!reverseFollowMap[targetId];

        targetUser.relationship = {
          isSelf,
          amIFollowing,
          followsMe,
          isMutual: amIFollowing && followsMe,
        };
      });
    } else {
      orderedFollowing.forEach((targetUser: any) => {
        targetUser.relationship = {
          isSelf: false,
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

  async syncFollowCounts(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const [followersCount, followingCount] = await Promise.all([
      FollowAuthor.countDocuments({
        authorId: userId,
        status: "follow",
      }),
      FollowAuthor.countDocuments({
        userId,
        status: "follow",
      }),
    ]);

    await User.findByIdAndUpdate(userId, {
      $set: {
        followersCount,
        followingCount,
      },
    });

    return {
      followersCount,
      followingCount,
    };
  },

  async updateUserOnline(userId: string) {
    await User.updateOne({ _id: userId }, { online: "online" });
  },

  async updateUserOffline(userId: string) {
    await User.updateOne({ _id: userId }, { online: new Date().getTime().toString() });
  }
};

export default UserService;