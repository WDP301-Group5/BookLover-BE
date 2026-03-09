import type { Request, Response } from "express";
import { io } from "../app";
import { ERR_INTERNAL_SERVER, ERR_UNAUTHORIZED } from "../consts/errorCode";
import { SUCCESS_OK } from "../consts/successCode";
import BuyStoneService from "../services/buyStoneService";
import ZalopayService from "../services/zalopayService";

export const createOrder = async (req: Request, res: Response) => {
	try {
		const { amount, description, items } = req.body;
		const userId = req?.user?.userId;
		if (!userId) {
			return res.status(ERR_UNAUTHORIZED).json({
				message: "User ID is missing in the request",
			});
		}
		const orderData = await ZalopayService.createOrder(
			userId,
			Number(amount),
			description,
			items,
		);
		return res.status(SUCCESS_OK).json({
			success: true,
			message: "Tạo đơn thanh toán thành công",
			data: orderData,
		});
	} catch (error) {
		return res.status(ERR_INTERNAL_SERVER).json({
			message: "Có lỗi xảy ra khi tạo đơn thanh toán",
			error: error,
		});
	}
};

export const zalopayCallback = async (req: Request, res: Response) => {
	try {
		const { data, mac } = req.body;

		const returnData = await ZalopayService.zalopayCallback(data, mac);

		if (returnData.status === 200) {
			// đã thanh toán thành công
			const dataCallback = JSON.parse(data);
			const app_trans_id = dataCallback.app_trans_id;
			// lưu data vào db
			await BuyStoneService.createBuyStoneRecord(app_trans_id);
			// gửi socket cho client
			io.to(`purchase_room_${app_trans_id}`).emit(
				`purchase_status_${app_trans_id}`,
				{
					status: "success",
				},
			);
		}
		// trả data cho zalopay
		return res.status(returnData.status).json({
			return_code: returnData.return_code,
			return_message: returnData.return_message,
		});
	} catch (err) {
		console.log("Server xảy ra lỗi khi xử lý callback từ ZaloPay:", err);
		return res.status(ERR_INTERNAL_SERVER).json({
			message: "Server xảy ra lỗi khi xử lý callback từ ZaloPay",
			error: err,
		});
	}
};
