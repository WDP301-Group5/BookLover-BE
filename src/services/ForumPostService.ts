import { ForumPost } from "../models/ForumPost";

const ForumPostService = {
	async getForumPostsOfForumCategory(
		forumCategoryId: string,
		offset: number,
		limit: number,
	) {
		try {
			const forumPosts = await ForumPost.find({ forumCategoryId })
				.sort({ createdAt: -1 })
				.skip(offset)
				.limit(limit)
				.populate({ path: "forumCategoryId", match: { status: "active" } })
				.populate("userId", "id nickName avatarURL")
				.lean();
			const total = await ForumPost.countDocuments({
				forumCategoryId,
			}).populate({ path: "forumCategoryId", match: { status: "active" } });
			const format = forumPosts.map((forumPost) => ({
				...forumPost,
				id: forumPost._id.toString(),
			}));
			return { forumPosts: format, total };
		} catch (error) {
			throw new Error(`Error fetching forum posts: ${error}`);
		}
	},

	async createForumPost(
		forumCategoryId: string,
		userId: string,
		content: string,
	) {
		try {
			const forumPost = await ForumPost.create({
				forumCategoryId,
				userId,
				content,
			});
			return forumPost;
		} catch (error) {
			throw new Error(`Error create forum post: ${error}`);
		}
	},
};

export default ForumPostService;
