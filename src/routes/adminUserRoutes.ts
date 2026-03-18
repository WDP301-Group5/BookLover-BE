import { Router } from "express";
import { verifyToken } from "../middleware/auth";
import { adminUserController } from "../controllers/adminUserController";

const adminUserRouter = Router();

adminUserRouter.get("/", adminUserController.listUsers);
adminUserRouter.get("/:id", adminUserController.getUserDetail);
adminUserRouter.patch("/:id", adminUserController.updateUser);
adminUserRouter.patch("/:id/ban", adminUserController.banUser);
adminUserRouter.patch("/:id/unban", adminUserController.unbanUser);
adminUserRouter.patch("/:id/status", adminUserController.updateUserStatus);
adminUserRouter.patch("/:id/role", adminUserController.updateUserRole);

export default adminUserRouter;