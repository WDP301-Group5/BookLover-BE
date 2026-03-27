import { Request, Response } from "express";
import WithdrawService from "../services/withdrawService";
import { SUCCESS_OK } from "../consts/successCode";
import { ERR_INTERNAL_SERVER, ERR_UNAUTHORIZED } from "../consts/errorCode";

export const getAllWithdraws = async (req: Request, res: Response) => {
  try {
    const userId = req.user ? req.user.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_UNAUTHORIZED)
        .json({ message: "Thiếu thông tin người dùng" });
    }
    const { page, limit, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const data = await WithdrawService.adminGetAllWithdraws(
      offset,
      Number(limit),
      status ? String(status) : "",
    );
    res.status(SUCCESS_OK).json(data);
  } catch (error) {
    res
      .status(ERR_INTERNAL_SERVER)
      .json({ message: "Có lỗi xảy ra khi lấy danh sách giao dịch.", error });
  }
};

export const updateWithdraw = async (req: Request, res: Response) => {
    try {
        const userId = req.user ? req.user.userId : undefined;
        if (!userId) {
            return res
                .status(ERR_UNAUTHORIZED)
                .json({ message: "Thiếu thông tin người dùng" });
        }
        const { status } = req.body;
        const { id } = req.params;
        const data = await WithdrawService.adminUpdateWithdraw(id, status);
        res.status(SUCCESS_OK).json(data);
    } catch (error) {
        return res.status(ERR_INTERNAL_SERVER).json({
            message: "Có lỗi xảy ra khi cập nhật giao dịch.",
            error,
        })
    }
}; 
