import { Story } from "../models/Story";
import { User } from "../models/User";
import { Chapter } from "../models/Chapter";

const removeVietnameseTones = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

const normalizeKeyword = (value: string) => {
  return removeVietnameseTones(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
};

const mapStatusFilter = (status?: string) => {
  if (!status || status === "Tất cả") return {};
  if (status === "Hoàn thành") return { isFinish: true };
  if (status === "Đang tiến hành") return { isFinish: false };
  return {};
};

const buildStorySort = (sortBy?: string) => {
  switch (sortBy) {
    case "Truyện mới":
      return (a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();

    case "Top tháng":
    case "Top tuần":
    case "Top ngày":
      return (a: any, b: any) => (b.views || 0) - (a.views || 0);

    case "Top theo dõi":
      return (a: any, b: any) => (b.followers || 0) - (a.followers || 0);

    case "Bình luận":
      return (a: any, b: any) => (b.commentCount || 0) - (a.commentCount || 0);

    case "Số chapter":
      return (a: any, b: any) => (b.chapterCount || 0) - (a.chapterCount || 0);

    case "Ngày cập nhật":
    default:
      return (a: any, b: any) =>
        new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
  }
};

const scoreProfileMatch = (user: any, keyword: string) => {
  const username = normalizeKeyword(user.username || "");
  const fullName = normalizeKeyword(user.fullName || "");
  const penName = normalizeKeyword(user.penName || "");
  const nickName = normalizeKeyword(user.nickName || "");

  if (!keyword) return 0;

  if (username === keyword) return 100;
  if (penName === keyword) return 95;
  if (fullName === keyword) return 90;
  if (nickName === keyword) return 85;

  if (username.startsWith(keyword)) return 80;
  if (penName.startsWith(keyword)) return 75;
  if (fullName.startsWith(keyword)) return 70;
  if (nickName.startsWith(keyword)) return 65;

  if (username.includes(keyword)) return 60;
  if (penName.includes(keyword)) return 55;
  if (fullName.includes(keyword)) return 50;
  if (nickName.includes(keyword)) return 45;

  return 0;
};

const scoreStoryMatch = (story: any, keyword: string) => {
  const rawTitle = (story.title || "").toLowerCase().trim();
  const normalizedTitle = normalizeKeyword(story.title || "");

  if (!keyword) return 0;

  const rawKeyword = keyword.toLowerCase().trim();
  const normalizedKeyword = normalizeKeyword(keyword);

  if (rawTitle === rawKeyword || normalizedTitle === normalizedKeyword) return 100;
  if (
    rawTitle.startsWith(rawKeyword) ||
    normalizedTitle.startsWith(normalizedKeyword)
  )
    return 80;
  if (
    rawTitle.includes(rawKeyword) ||
    normalizedTitle.includes(normalizedKeyword)
  )
    return 60;

  return 0;
};

const searchService = {
  async searchStories({
  q = "",
  page = 1,
  limit = 10,
  status,
  category,
  sortBy,
}: {
  q?: string;
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  sortBy?: string;
}) {
  try {
    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 10;
    const keyword = q.trim();

    const query: any = {
      status: "active",
      ...mapStatusFilter(status),
    };

    if (category && category !== "all") {
      query.$or = [{ genres: category }, { topics: category }];
    }

    const stories = await Story.find(query)
      .populate("authorId", "username fullName penName avatarURL")
      .populate("topics", "name")
      .populate("genres", "name")
      .lean();

    const storyIds = stories.map((story: any) => story._id);

    const chapterStats = await Chapter.aggregate([
      {
        $match: {
          storyId: { $in: storyIds },
        },
      },
      {
        $group: {
          _id: "$storyId",
          totalChapters: { $sum: 1 },
        },
      },
    ]);

    const chapterCountMap = new Map(
      chapterStats.map((item: any) => [item._id.toString(), item.totalChapters]),
    );

    const matchedStories = stories
      .map((story: any) => {
        const matchScore = scoreStoryMatch(story, keyword);

        return {
          ...story,
          topics: Array.isArray(story.topics)
            ? story.topics.map((topic: any) => topic?.name).filter(Boolean)
            : [],
          genres: Array.isArray(story.genres)
            ? story.genres.map((genre: any) => genre?.name).filter(Boolean)
            : [],
          chapterCount: chapterCountMap.get(story._id.toString()) || 0,
          chapters: chapterCountMap.get(story._id.toString()) || 0,
          chapterNumber: chapterCountMap.get(story._id.toString()) || 0,
          matchScore,
        };
      })
      .filter((story: any) => (keyword ? story.matchScore > 0 : true))
      .sort((a: any, b: any) => {
        if (keyword && b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }

        return buildStorySort(sortBy)(a, b);
      });

    const total = matchedStories.length;
    const startIndex = (currentPage - 1) * currentLimit;
    const paginatedStories = matchedStories.slice(
      startIndex,
      startIndex + currentLimit,
    );

    return {
      story: paginatedStories,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
    };
  } catch (error) {
    throw new Error(`Có lỗi xảy ra khi tìm truyện: ${error}`);
  }
},

  async searchProfiles({
    q = "",
    limit = 20,
  }: {
    q?: string;
    limit?: number;
  }) {
    try {
      const keyword = normalizeKeyword(q);

      if (!keyword) return [];

      const users = await User.find({
        status: "active",
      })
        .select(
          "_id username fullName nickName penName avatarURL followersCount storiesCount role",
        )
        .lean();

      const matchedUsers = users
        .map((user: any) => ({
          ...user,
          matchScore: scoreProfileMatch(user, keyword),
        }))
        .filter((user: any) => user.matchScore > 0)
        .sort((a: any, b: any) => {
          if (b.matchScore !== a.matchScore) {
            return b.matchScore - a.matchScore;
          }

          if ((b.followersCount || 0) !== (a.followersCount || 0)) {
            return (b.followersCount || 0) - (a.followersCount || 0);
          }

          return (b.storiesCount || 0) - (a.storiesCount || 0);
        })
        .slice(0, Number(limit) || 20);

      return matchedUsers;
    } catch (error) {
      throw new Error(`Có lỗi xảy ra khi tìm hồ sơ: ${error}`);
    }
  },
};

export default searchService;