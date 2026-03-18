import { ForumPost } from "../models/ForumPost";
import { ReplyForumPost } from "../models/ReplyForumPost";

const ReplyForumPostService = {
  async createReplyForumPost(
    userId: string,
    forumPostId: string,
    content: string,
  ) {
    try {
      const replyForumPost = await ReplyForumPost.create({
        userId,
        forumPostId,
        content,
      });
      await ForumPost.updateOne(
        { _id: forumPostId },
        { $inc: { replyCount: 1 } },
      );
      return replyForumPost;
    } catch (error) {
      throw new Error(`Error creating reply forum post: ${error}`);
    }
  },

  async getReplyForumPosts(forumPostId: string) {
    try {
      const replyForumPosts = await ReplyForumPost.find({ forumPostId })
        .sort({
          createdAt: -1,
        })
        .populate("userId", "id nickName avatarURL");
      return replyForumPosts;
    } catch (error) {
      throw new Error(`Error getting reply forum posts: ${error}`);
    }
  },
};

export default ReplyForumPostService;
