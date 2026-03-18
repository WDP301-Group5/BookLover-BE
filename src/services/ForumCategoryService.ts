import { ForumCategory } from "../models/ForumCategory";
import { slugify } from "../utils/validation";

const ForumCategoryService = {
  async getForumCatoryOfForum(
    slug: string,
    type: string,
    offset: number,
    limit: number,
  ) {
    try {
      const forumCategories = await ForumCategory.find({
        type: type,
        status: "active",
      })
        .sort({
          createdAt: -1,
        })
        .skip(offset)
        .limit(limit)
        .populate({
          path: "forumId",
          select: "name slug",
          match: { slug: slug, status: "active" },
        })
        .populate("storyId", "title slug image")
        .populate("author", "username nickName avatarURL")
        .lean();
      const total = await ForumCategory.countDocuments({
        status: "active",
      }).populate({
        path: "forumId",
        match: { slug: slug, status: "active" },
      });
      return { forumCategories, total };
    } catch (error) {
      throw new Error(`Error fetching forum categories: ${error}`);
    }
  },

  async createForumCategory(
    forumId: string,
    author: string,
    title: string,
    description: string,
    storyId: string,
    type: string,
  ) {
    try {
      let slug = slugify(title);
      const slugCount = await ForumCategory.countDocuments({
        slug: new RegExp(`^${slug}(-\\d+)?$`, "i"),
      });
      if (slugCount > 0) {
        slug = `${slug}-${slugCount + 1}`;
      }
      const forumCategory = await ForumCategory.create({
        forumId,
        author,
        title,
        slug,
        description,
        storyId: type === "story" ? storyId : undefined,
        type,
      });
      return forumCategory;
    } catch (error) {
      throw new Error("Error creating forum category: " + error);
    }
  },

  async getForumCategoryBySlug(slug: string) {
    try {
      const forumCategory = await ForumCategory.findOne({ slug }).lean();
      if (!forumCategory) {
        return {};
      }
      forumCategory.id = forumCategory._id.toString();
      await ForumCategory.updateOne({ slug }, { $inc: { view: 1 } });
      return forumCategory;
    } catch (error) {
      throw new Error("Error fetching forum category by slug: " + error);
    }
  }
};

export default ForumCategoryService;
