export interface Genre {
  _id: string;
  name: string;
  description: string;
  avatar: string;
  status: "active" | "inactive"; // nếu chỉ có 2 trạng thái
  createdAt: string; // hoặc Date nếu parse sang Date object
  updatedAt: string; // hoặc Date nếu parse sang Date object
  __v: number;
}