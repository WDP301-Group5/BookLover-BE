import type { Request, Response } from "express";
import FollowService from "../services/followService";

/**
 * Toggle follow/unfollow user
 * POST /users/:id/follow
 */
export const toggleFollow = async (req: Request, res: Response) => {
	try {
		const currentUserId = req.user?.userId;
		const targetUserId = req.params.id;

		if (!currentUserId) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const isAlreadyFollowing = await FollowService.isFollowing(
			currentUserId,
			targetUserId,
		);

		let result;
		if (isAlreadyFollowing) {
			result = await FollowService.unfollowUser(currentUserId, targetUserId);
		} else {
			result = await FollowService.followUser(currentUserId, targetUserId);
		}

		return res.status(200).json(result);
	} catch (err: any) {
		return res.status(400).json({ message: err.message || "Error" });
	}
};
