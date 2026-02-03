import client from "../config/redis";
import { ZALOPAY_ORDER_CODE } from "../consts/redisCode";
import { BuyStone } from "../models/BuyStone";
import { User } from "../models/User";

const BuyStoneService = {
	async createBuyStoneRecord(app_trans_id: string) {
		try {
			const cachedData = await client.get(
				`${ZALOPAY_ORDER_CODE}_${app_trans_id}`,
			);
			if (!cachedData) {
				throw new Error("No order data found in cache");
			}
			const orderData = JSON.parse(cachedData);

			const user = await User.findById(orderData.userId)
				.select("spiritStones")
				.lean();
			if (!user) {
				throw new Error("User not found");
			}
			const stoneBefore = user.spiritStones || 0;
			const stoneAfter = stoneBefore + orderData.quantity;

			const buyStoneRecord = new BuyStone({
				userId: orderData.userId,
				app_trans_id: orderData.app_trans_id,
				orderCode: orderData.orderCode,
				decription: orderData.description,
				money: orderData.money,
				quantity: orderData.quantity,
				stoneBefore: stoneBefore,
				stoneAfter: stoneAfter,
				status: "success",
			});

			const savedBuyStoneRecord = await buyStoneRecord.save();

			return savedBuyStoneRecord;
		} catch (error) {
			throw new Error(`Error creating buy stone record: ${error}`);
		}
	},
};

export default BuyStoneService;
