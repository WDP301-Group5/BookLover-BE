export interface IFollowStory {
	id: string;
	userId: string;
	storyId: string;
	status: "follow" | "unsend" | "unfollow";
	// follow thì mặc định là send notice
	// có thể chuyển sang unsend để ko nhận thông báo
	// unfollow là bỏ follow
	createdAt?: Date;
	updatedAt?: Date;
}
