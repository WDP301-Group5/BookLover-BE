import { Router } from "express";
import { adminUserController } from "../controllers/adminUserController";
import { verifyToken } from "../middleware/auth";

const adminUserRouter = Router();

adminUserRouter.get("/", adminUserController.listUsers);
adminUserRouter.get("/:id", adminUserController.getUserDetail);
adminUserRouter.patch("/:id", adminUserController.updateUser);
adminUserRouter.patch("/:id/ban", adminUserController.banUser);
adminUserRouter.patch("/:id/unban", adminUserController.unbanUser);
adminUserRouter.patch("/:id/status", adminUserController.updateUserStatus);
adminUserRouter.patch("/:id/role", adminUserController.updateUserRole);

export default adminUserRouter;
