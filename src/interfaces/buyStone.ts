export interface IBuyStone {
	// giao dịch tiền để mua linh thạch
	id: string;
	userId: string;
	app_trans_id: string;
	orderCode: string;
	description: string;
	money: number;
	quantity: number;
	stoneBefore: number;
	stoneAfter: number;
	status: "success" | "failed" | "pending";
	createdAt?: Date;
	updatedAt?: Date;
}
