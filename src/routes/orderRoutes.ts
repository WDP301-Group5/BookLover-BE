import express from "express";
import { createOrder, zalopayCallback } from "../controllers/zalopayController";
import { verifyToken } from "../middleware/auth";

const orderRouter = express.Router();

orderRouter.post("/zalopay/create", verifyToken, createOrder);
orderRouter.post("/zalopay/callback", zalopayCallback);

export default orderRouter;
