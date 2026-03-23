import { ForumPost } from "../models/ForumPost";
import { ForumPostReact } from "../models/ForumPostReact";
import notificationService from "./notificationService";

const ForumPostReactService = {
  async getUserReactOfForumCategory(userId: string, forumCategoryId: string) {
    try {
      const result = await ForumPostReact.find({
        userId,
        forumCategoryId,
      }).lean();
      const format = result.map((forumPostReact) => ({
        ...forumPostReact,
        id: forumPostReact._id.toString(),
      }));
      return format;
    } catch (error) {
      throw new Error(`Error fetching user react forum post: ${error}`);
    }
  },

  async userReactForumPost(
    userId: string,
    forumCategoryId: string,
    forumPostId: string,
    react: string,
  ) {
    try {
      const forumPost = await ForumPost.findById(forumPostId).lean();
      if (!forumPost) {
        throw new Error("Forum post not found");
      }

      const isExist = await ForumPostReact.findOne({ userId, forumPostId });

      if (react === "unlike") {
        if (isExist) {
          await ForumPostReact.deleteOne({ _id: isExist._id });

          if (isExist.react !== "unlike") {
            await ForumPost.updateOne(
              { _id: forumPostId },
              { $inc: { [`react.${isExist.react}`]: -1 } },
            );
          }
        }

        return { message: "Removed react successfully" };
      }

      if (isExist) {
        if (isExist.react === react) return isExist;
        const forumPostReact = await ForumPostReact.findOneAndUpdate(
          { userId, forumPostId },
          { react },
          { new: true },
        );
        await ForumPost.updateOne(
          { _id: forumPostId },
          {
            $inc: { [`react.${react}`]: 1, [`react.${isExist.react}`]: -1 },
          },
        );

        await notificationService.notifyForumPostReacted({
          fromUserId: userId,
          postOwnerId: forumPost.userId.toString(),
          forumPostId,
          forumCategoryId,
          react,
        });

        return forumPostReact;
      }
      const result = await ForumPostReact.create({
        userId,
        forumCategoryId,
        forumPostId,
        react,
      });
      await ForumPost.updateOne(
        { _id: forumPostId },
        { $inc: { [`react.${react}`]: 1 } },
      );

      await notificationService.notifyForumPostReacted({
        fromUserId: userId,
        postOwnerId: forumPost.userId.toString(),
        forumPostId,
        forumCategoryId,
        react,
      });

      return result;
    } catch (error) {
      throw new Error(`Error user react forum post: ${error}`);
    }
  },
};

export default ForumPostReactService;
