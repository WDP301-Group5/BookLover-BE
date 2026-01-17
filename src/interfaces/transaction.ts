export interface ITransaction {
	// mua vip bằng linh thậch
	id: string;
	userId: string;
	planId: string;
	spiritStones: number;
	stoneBefore: number;
	stoneAfter: number;
	status: "success" | "failed" | "pending";
	createdAt?: Date;
	updatedAt?: Date;
}
