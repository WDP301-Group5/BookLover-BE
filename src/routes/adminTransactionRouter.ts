import { Router } from "express";
import {
	getRevenueReport,
	getTransactions,
	purchaseChapter,
	topUpStones,
	updateStatus,
} from "../controllers/adminTransactionController";

const adminTransactionRouter = Router();

adminTransactionRouter.get("/", getTransactions);
adminTransactionRouter.get("/revenue-report", getRevenueReport);
adminTransactionRouter.patch("/status", updateStatus);
adminTransactionRouter.post("/topup", topUpStones);
adminTransactionRouter.post("/purchase", purchaseChapter);

export default adminTransactionRouter;
