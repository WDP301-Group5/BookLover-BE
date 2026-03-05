import axios from "axios";
import client from "../config/redis";
import { ZALOPAY_ORDER_CODE } from "../consts/redisCode";
import {
	buildAppTransId,
	buildOrderPayload,
	createOrderCode,
	hmacSha256Hex,
} from "../utils/zalopay";

const ZALOPAY_ENDPOINT =
	process.env.ZALOPAY_ENDPOINT || "https://sb-openapi.zalopay.vn/v2/create";

const ZalopayService = {
	async createOrder(
		userId: string,
		amount: number = 10000,
		description = "Mua linh thạch",
		items = [],
	) {
		try {
			const orderData: { [key: string]: unknown } = {};
			// YYMMDD
			const app_trans_id = buildAppTransId();

			const order = buildOrderPayload(amount, description, items);

			const resp = await axios.post(ZALOPAY_ENDPOINT, order, {
				headers: { "Content-Type": "application/json" },
				timeout: 20000,
			});

			const data = resp.data || {};

			data.orderCode = createOrderCode();
			data.amount = amount;
			data.description = description;
			data.app_trans_id = app_trans_id;

			// gán data cho orderData để lưu vào DB nếu thanh toán thành công
			orderData.userId = userId;
			orderData.app_trans_id = app_trans_id;
			orderData.orderCode = data.orderCode;
			orderData.money = Number(amount);
			orderData.quantity = Number(amount);
			orderData.description = description;

			await client.set(
				`${ZALOPAY_ORDER_CODE}_${app_trans_id}`,
				JSON.stringify(orderData),
				{ EX: 20 * 60 }, // expire in 20 minutes
			);
			return data;
		} catch (err) {
			const error = err as Error;
			console.error("❌ create order failed:", error);
			throw new Error(`Create ZaloPay order failed: ${error.message}`);
		}
	},

	async zalopayCallback(data: string, mac: string) {
		// nếu thiếu thông tin thì trả về lỗi thiếu thông tin
		if (!data || !mac) {
			return {
				status: 400,
				return_code: -1,
				return_message: "missing data or mac",
			};
		}

		// nếu mac không đúng thì trả về lỗi xác thực
		const macCheck = hmacSha256Hex(process.env.ZALOPAY_KEY2 || "", data);
		if (macCheck !== mac) {
			return { status: 400, return_code: -1, return_message: "invalid mac" };
		}

		// còn lại là hợp lệ thì trả về thành công
		return { status: 200, return_code: 1, return_message: "success" };
	},
};

export default ZalopayService;
