import { Forum } from "../models/Forum";
import { ForumCategory } from "../models/ForumCategory";
import { slugify } from "../utils/validation";

const ForumService = {
  async getAllForums() {
    try {
      const forums = await Forum.aggregate([
        {
          $lookup: {
            from: "forumcategories",
            localField: "_id",
            foreignField: "forumId",
            as: "categories",
          },
        },
        {
          $addFields: {
            categoryCount: { $size: "$categories" },
          },
        },
        {
          $project: {
            categories: 0, // nếu không cần trả về danh sách category
          },
        },
      ]);
      const formattedResult = forums?.map((forum) => ({
        ...forum,
        id: forum._id.toString(),
      }));
      return formattedResult;
    } catch (error) {
      throw new Error("Error fetching forums: " + error);
    }
  },

  async getForumBySlug(slug: string) {
    try {
      const forum = await Forum.findOne({ slug }).lean();
      if (!forum) {
        throw new Error("Forum not found");
      }
      const format = {
        ...forum,
        id: forum?._id.toString(),
      };
      return format;
    } catch (error) {
      throw new Error("Error fetching forum by slug: " + error);
    }
  },

  async createForum(name: string, description: string) {
    try {
      let slug = slugify(name);
      const slugCount = await Forum.countDocuments({
        slug: new RegExp(`^${slug}(-\\d+)?$`, "i"),
      });
      if (slugCount > 0) {
        slug = `${slug}-${slugCount + 1}`;
      }
      const forum = await Forum.create({
        slug,
        name,
        description,
        status: "active",
      });
      return forum;
    } catch (error) {
      throw new Error("Error creating forum: " + error);
    }
  },
};

export default ForumService;
