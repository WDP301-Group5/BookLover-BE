import express from 'express';
import { createWithdraw, getAllPremiumStorys, getAllTransactions, getAuthorGeneralRevenueInfo, getWithdraws } from '../controllers/authorRevenueController';
import { verifyToken } from '../middleware/auth';

const authorRevenueRouter = express.Router();

authorRevenueRouter.get("/general", verifyToken, getAuthorGeneralRevenueInfo);
authorRevenueRouter.get("/all", verifyToken, getAllTransactions);
authorRevenueRouter.get("/premium-story", verifyToken, getAllPremiumStorys);
authorRevenueRouter.get("/withdraw", verifyToken, getWithdraws);
authorRevenueRouter.post("/withdraw", verifyToken, createWithdraw);

export default authorRevenueRouter;