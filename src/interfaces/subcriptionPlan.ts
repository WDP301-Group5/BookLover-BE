export interface ISubcriptionPlan {
	id: string;
	name: string;
	level: number; // cấp gói, từ 1 đến 10
	features: string[]; // các chức năng của gói vip
	description: string;
	spiritStones: number; // số linh thách cần
	extendedTime: string; // thời gian kéo dài (ngày, tuần, tháng, quý, năm, ...)
	status: "active" | "inactive" | "pending";
	// active: đang dùng gói vip
	// inactive: đã hết hạn
	// pending: chờ sử dụng (có gói cao cấp hơn đang dùng,
	//   hết gói cao cấp hơn thì về gói thấp cấp hơn)
	createdAt?: Date;
	updatedAt?: Date;
}
