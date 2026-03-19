// src/interfaces/chapter.ts
const ChapterStatus = [
  "draft", // tác giả lưu nháp
  "active", // puclic chương
  "inactive", // tác giả xóa khỏi tìm kiếm (cá nhân tác giả mới xem đc)
  "error", // chương public bị lỗi
  "pending", // chương chờ duyệt, có thể chưa cần
  "rejected", // chương bị từ chối, có thể chưa cần
  "banned", // vi phạm tiêu chuẩn nên bị ban
  "private", // chương chỉ tác giả mới xem được, có thể chưa cần
];

export interface IChapter {
  id: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  isPremium: boolean;
  price: number; // giá bán nếu là chương vip
  contentURL: string;
  status: (typeof ChapterStatus)[number] | "draft";
  createdAt?: Date;
  updatedAt?: Date;
}
