export interface IFollowAuthor {
	id: string;
	userId: string;
	authorId: string;
	status: "follow" | "unsend" | "unfollow";
	// follow thì mặc định là send notice
	// có thể chuyển sang unsend để ko nhận thông báo
	// unfollow là bỏ follow
	createdAt?: Date;
	updatedAt?: Date;
}
