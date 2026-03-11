import { Types } from "mongoose";
import { Follow } from "../models/Follow";
import { User } from "../models/User";

const FollowService = {
    async isFollowing(
        followerId: string,
        followingId: string
    ): Promise<boolean> {
        const follow = await Follow.findOne({
            followerId: new Types.ObjectId(followerId),
            followingId: new Types.ObjectId(followingId),
        });

        return !!follow;
    },

    async followUser(
        followerId: string,
        followingId: string
    ) {
        if (followerId === followingId) {
            throw new Error("Không thể follow chính mình");
        }

        const existed = await Follow.findOne({
            followerId,
            followingId,
        });

        if (existed) {
            throw new Error("Bạn đã follow user này");
        }

        await Follow.create({
            followerId,
            followingId,
        });

        await User.findByIdAndUpdate(followingId, {
            $inc: { followersCount: 1 },
        });

        await User.findByIdAndUpdate(followerId, {
            $inc: { followingCount: 1 },
        });

        return { status: "follow" };
    },

    async unfollowUser(
        followerId: string,
        followingId: string
    ) {
        const follow = await Follow.findOneAndDelete({
            followerId,
            followingId,
        });

        if (!follow) {
            throw new Error("Bạn chưa follow user này");
        }

        await User.findByIdAndUpdate(followingId, {
            $inc: { followersCount: -1 },
        });

        await User.findByIdAndUpdate(followerId, {
            $inc: { followingCount: -1 },
        });

        return { status: "unfollow" };
    },
}
 
export default FollowService;