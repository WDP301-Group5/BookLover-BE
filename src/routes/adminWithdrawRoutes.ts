import express from "express";
import { getAllWithdraws, updateWithdraw } from "../controllers/adminWithdrawController";
import { verifyToken } from "../middleware/auth";
const adminWithdrawRouter = express.Router();

adminWithdrawRouter.get("/all", verifyToken, getAllWithdraws);
adminWithdrawRouter.patch("/:id", verifyToken, updateWithdraw);

export default adminWithdrawRouter;