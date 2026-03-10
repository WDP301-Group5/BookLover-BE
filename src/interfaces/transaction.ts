export interface ITransaction {
	// mua vip bằng linh thậch
	id: string;
	userId: string;
	chapterId: string;
	spiritStones: number;
	stoneBefore: number;
	stoneAfter: number;
	startAt: Date;
	endAt: Date;
	status: "success" | "failed" | "pending";
	createdAt?: Date;
	updatedAt?: Date;
}
