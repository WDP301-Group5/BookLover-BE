import { Router } from "express";
import { verifyToken } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { adminUserController } from "../controllers/adminUserController";

const adminUserRouter = Router();

adminUserRouter.use(verifyToken, requireAdmin);

adminUserRouter.get("/", adminUserController.listUsers.bind(adminUserController));
adminUserRouter.get("/:id", adminUserController.getUserDetail.bind(adminUserController));
adminUserRouter.patch("/:id", adminUserController.updateUser.bind(adminUserController));
adminUserRouter.patch("/:id/ban", adminUserController.banUser.bind(adminUserController));
adminUserRouter.patch("/:id/unban", adminUserController.unbanUser.bind(adminUserController));
adminUserRouter.patch("/:id/status", adminUserController.updateUserStatus.bind(adminUserController));
adminUserRouter.patch("/:id/role", adminUserController.updateUserRole.bind(adminUserController));

export default adminUserRouter;