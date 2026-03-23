// src/services/reviewService.ts
import { Review } from "../models/Review";
import { Story } from "../models/Story";
import mongoose from "mongoose";

type ReviewSortType = "newest" | "oldest";

const normalizeLimit = (limit?: number, fallback = 20) => {
  const parsed = Number(limit || fallback);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, 100);
};

const normalizePage = (page?: number) => {
  const parsed = Number(page || 1);
  if (Number.isNaN(parsed) || parsed <= 0) return 1;
  return parsed;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const reviewService = {
  async getReviewStories({
    search = "",
    limit = 50,
  }: {
    search?: string;
    limit?: number;
  }) {
    try {
      const finalLimit = normalizeLimit(limit, 50);
      const query: Record<string, any> = {
        status: "active",
      };

      if (search.trim()) {
        query.title = {
          $regex: escapeRegex(search.trim()),
          $options: "i",
        };
      }

      const stories = await Story.find(query)
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(finalLimit)
        .populate("authorId", "username fullName penName avatarURL")
        .populate("topics", "name")
        .populate("genres", "name")
        .lean();

      const items = stories.map((story: any) => {
        const genres = Array.isArray(story.genres)
          ? story.genres.map((item: any) => item?.name).filter(Boolean)
          : [];

        const topics = Array.isArray(story.topics)
          ? story.topics.map((item: any) => item?.name).filter(Boolean)
          : [];

        return {
          id: story._id?.toString(),
          title: story.title,
          slug: story.slug,
          image: story.image,
          cover: story.image,
          link: `/truyen/${story.slug}`,
          genre: genres[0] || topics[0] || "Khác",
          genres,
          topics,
          views: story.views || 0,
          followers: story.followers || 0,
          isPremium: !!story.isPremium,
          author: {
            id: story.authorId?._id?.toString?.() || "",
            penName:
              story.authorId?.penName ||
              story.authorId?.fullName ||
              story.authorId?.username ||
              "Đang cập nhật",
            avatarURL: story.authorId?.avatarURL || "",
          },
        };
      });

      return {
        total: items.length,
        items,
      };
    } catch (error) {
      throw new Error(`Có lỗi xảy ra khi lấy danh sách truyện để review: ${error}`);
    }
  },

  async getReviews({
  sort = "newest",
  genre = "",
  search = "",
  page = 1,
  limit = 5,
}: {
  sort?: ReviewSortType;
  genre?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const finalSort: ReviewSortType = sort === "oldest" ? "oldest" : "newest";
    const finalPage = normalizePage(page);
    const finalLimit = normalizeLimit(limit, 5);
    const skip = (finalPage - 1) * finalLimit;

    const sortOption: Record<string, mongoose.SortOrder> =
      finalSort === "oldest"
        ? { createdAt: 1, _id: 1 }
        : { createdAt: -1, _id: -1 };

    const reviews = await Review.find({
      status: "active",
      $or: [{ replyOf: null }, { replyOf: "" }],
    })
      .sort(sortOption)
      .populate("userId", "username fullName nickName penName avatarURL")
      .populate({
        path: "storyId",
        select:
          "title slug image description views followers isPremium topics genres authorId status",
        populate: [
          {
            path: "authorId",
            select: "username fullName penName avatarURL",
          },
          {
            path: "topics",
            select: "name",
          },
          {
            path: "genres",
            select: "name",
          },
        ],
      })
      .lean();

    let mappedItems = reviews
      .map((review: any) => {
        const story = review.storyId;
        const user = review.userId;

        if (!story || story.status !== "active") return null;

        const genres = Array.isArray(story.genres)
          ? story.genres.map((item: any) => item?.name).filter(Boolean)
          : [];

        const topics = Array.isArray(story.topics)
          ? story.topics.map((item: any) => item?.name).filter(Boolean)
          : [];

        const genreLabel = genres[0] || topics[0] || "Khác";
        const userName =
          user?.penName ||
          user?.nickName ||
          user?.fullName ||
          user?.username ||
          "Ẩn danh";

        return {
          id: review._id?.toString(),
          content: review.content || "",
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          replyCount: review.replyCount || 0,
          react: {
            like: review.react?.like || 0,
            love: review.react?.love || 0,
            haha: review.react?.haha || 0,
            wow: review.react?.wow || 0,
            sad: review.react?.sad || 0,
            angry: review.react?.angry || 0,
          },
          user: {
            id: user?._id?.toString?.() || "",
            name: userName,
            username: user?.username || "",
            avatar: user?.avatarURL || "",
          },
          story: {
            id: story._id?.toString(),
            title: story.title,
            slug: story.slug,
            image: story.image,
            cover: story.image,
            link: `/truyen/${story.slug}`,
            genre: genreLabel,
            genres,
            topics,
            views: story.views || 0,
            followers: story.followers || 0,
            isPremium: !!story.isPremium,
            author: {
              id: story.authorId?._id?.toString?.() || "",
              penName:
                story.authorId?.penName ||
                story.authorId?.fullName ||
                story.authorId?.username ||
                "Đang cập nhật",
              avatarURL: story.authorId?.avatarURL || "",
            },
          },
        };
      })
      .filter(Boolean) as any[];

    if (genre.trim() && genre !== "Tất cả") {
      mappedItems = mappedItems.filter(
        (item) => item.story.genre.toLowerCase() === genre.trim().toLowerCase()
      );
    }

    if (search.trim()) {
      const searchLower = search.trim().toLowerCase();

      mappedItems = mappedItems.filter((item) => {
        const plainContent = String(item.content || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();

        return (
          item.story.title.toLowerCase().includes(searchLower) ||
          plainContent.includes(searchLower) ||
          item.user.name.toLowerCase().includes(searchLower) ||
          item.user.username.toLowerCase().includes(searchLower)
        );
      });
    }

    const total = mappedItems.length;
    const items = mappedItems.slice(skip, skip + finalLimit);

    return {
      sort: finalSort,
      total,
      items,
    };
  } catch (error) {
    throw new Error(`Có lỗi xảy ra khi lấy danh sách review: ${error}`);
  }
},

  async createReview({
    userId,
    storyId,
    content,
  }: {
    userId: string;
    storyId: string;
    content: string;
  }) {
    try {
      const cleanContent = content?.trim();

      if (!userId) {
        throw new Error("Vui lòng đăng nhập để gửi review");
      }

      if (!storyId) {
        throw new Error("Thiếu thông tin truyện");
      }

      if (!cleanContent) {
        throw new Error("Nội dung review không được để trống");
      }

      const plainTextLength = cleanContent.replace(/<[^>]+>/g, "").trim().length;
      if (plainTextLength < 50) {
        throw new Error("Review quá ngắn! Vui lòng viết ít nhất 50 ký tự.");
      }

      const story = await Story.findOne({
        _id: storyId,
        status: "active",
      });

      if (!story) {
        throw new Error("Không tìm thấy truyện để review");
      }

      const created = await Review.create({
        userId,
        storyId,
        content: cleanContent,
        replyCount: 0,
        replyOf: null,
        react: {
          like: 0,
          love: 0,
          haha: 0,
          wow: 0,
          sad: 0,
          angry: 0,
        },
        status: "active",
      });

      const review = await Review.findById(created._id)
        .populate("userId", "username fullName nickName penName avatarURL")
        .populate({
          path: "storyId",
          select:
            "title slug image description views followers isPremium topics genres authorId status",
          populate: [
            {
              path: "authorId",
              select: "username fullName penName avatarURL",
            },
            {
              path: "topics",
              select: "name",
            },
            {
              path: "genres",
              select: "name",
            },
          ],
        })
        .lean();

      const storyData: any = review?.storyId;
      const userData: any = review?.userId;

      const genres = Array.isArray(storyData?.genres)
        ? storyData.genres.map((item: any) => item?.name).filter(Boolean)
        : [];

      const topics = Array.isArray(storyData?.topics)
        ? storyData.topics.map((item: any) => item?.name).filter(Boolean)
        : [];

      return {
        id: review?._id?.toString(),
        content: review?.content || "",
        createdAt: review?.createdAt,
        updatedAt: review?.updatedAt,
        replyCount: review?.replyCount || 0,
        react: {
          like: review?.react?.like || 0,
          love: review?.react?.love || 0,
          haha: review?.react?.haha || 0,
          wow: review?.react?.wow || 0,
          sad: review?.react?.sad || 0,
          angry: review?.react?.angry || 0,
        },
        user: {
          id: userData?._id?.toString?.() || "",
          name:
            userData?.penName ||
            userData?.nickName ||
            userData?.fullName ||
            userData?.username ||
            "Ẩn danh",
          username: userData?.username || "",
          avatar: userData?.avatarURL || "",
        },
        story: {
          id: storyData?._id?.toString?.() || "",
          title: storyData?.title || "",
          slug: storyData?.slug || "",
          image: storyData?.image || "",
          cover: storyData?.image || "",
          link: `/truyen/${storyData?.slug || ""}`,
          genre: genres[0] || topics[0] || "Khác",
          genres,
          topics,
          views: storyData?.views || 0,
          followers: storyData?.followers || 0,
          isPremium: !!storyData?.isPremium,
          author: {
            id: storyData?.authorId?._id?.toString?.() || "",
            penName:
              storyData?.authorId?.penName ||
              storyData?.authorId?.fullName ||
              storyData?.authorId?.username ||
              "Đang cập nhật",
            avatarURL: storyData?.authorId?.avatarURL || "",
          },
        },
      };
    } catch (error) {
      throw new Error(`Có lỗi xảy ra khi tạo review: ${error}`);
    }
  },

  async updateIncreaseReactReviewCount(reviewId: string, react: string) {
  if (!reviewId || !react || react === "unlike") return null;

  return await Review.findByIdAndUpdate(
    reviewId,
    {
      $inc: {
        [`react.${react}`]: 1,
      },
    },
    { new: true }
  );
},

async updateDecreaseReactReviewCount(reviewId: string, react: string) {
  if (!reviewId || !react || react === "unlike") return null;

  return await Review.findByIdAndUpdate(
    reviewId,
    {
      $inc: {
        [`react.${react}`]: -1,
      },
    },
    { new: true }
  );
},
};

export default reviewService;