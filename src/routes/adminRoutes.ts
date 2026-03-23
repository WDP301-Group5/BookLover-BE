import express from "express";
import {
  createAdmin,
  deleteAdmin,
  deleteManyAdmins,
  getAdminById,
  getAllAdmins,
  updateAdmin,
} from "../controllers/adminController.js";

import { requireAdmin } from "../middleware/rbac.js";

import adminBannedKeywordRouter from "./adminBannedKeywordRoutes.js";
import adminChapterCensorRouter from "./adminChapterCensorRoutes.js";
import adminReportRouter from "./adminReportRoutes.js";
import adminStoryCensorRouter from "./adminStoryCensorRoutes.js";
import adminUserRouter from "./adminUserRoutes.js";
import adminTransactionRouter from "./adminTransactionRouter.js";
import adminDashboardRoutes from "./adminDashboardRoutes.js";

const adminRouter = express.Router();

// Tất cả routes đều yêu cầu admin role
adminRouter.use(requireAdmin);

// Routes
adminRouter.use("/users", adminUserRouter);
adminRouter.use("/stories", adminStoryCensorRouter);
adminRouter.use("/chapters", adminChapterCensorRouter);
adminRouter.use("/reports", adminReportRouter);
adminRouter.use("/banned-keywords", adminBannedKeywordRouter);
adminRouter.use("/transactions", adminTransactionRouter);
adminRouter.use("/dashboard", adminDashboardRoutes);
adminRouter.get("/", getAllAdmins);
adminRouter.get("/:id", getAdminById);
adminRouter.post("/", createAdmin);
adminRouter.put("/:id", updateAdmin);
adminRouter.delete("/:id", deleteAdmin);
adminRouter.post("/delete-many", deleteManyAdmins);

export default adminRouter;
