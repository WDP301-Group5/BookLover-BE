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
	type: "topup" | "chapter_purchase";
	adminShare?: number;
	authorShare?: number;
	description?: string;
	createdAt?: Date;
	updatedAt?: Date;
}
