const StoryStatus = [
	"draft", // Tác giả lưu nháp
	"pending", // Truyện chờ duyệt
	"active", // Tác giả công khai truyện
	"rejected", // Truyện bị từ chối
	"private", // Tác giả xóa khỏi tìm kiếm (cá nhân tác giả mới xem đc)
	"banned", // Truyện đã bị cấm vì vi phạm
];

export interface IStory {
	id: string;
	title: string;
	slug: string;
	image: string;
	description: string;
	authorId: string;
	topics: string[];
	tags: string[];
	status: (typeof StoryStatus)[number] | "draft";
	isPremium: boolean;
	isFinish: boolean;
	views: number;
	stars: number;
	rates: number;
	followers: number;
	createdAt?: Date;
	updatedAt?: Date;
}
