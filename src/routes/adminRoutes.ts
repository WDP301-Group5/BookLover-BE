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

import adminChapterCensorRouter from "./adminChapterCensorRoutes.js";
import adminReportRouter from "./adminReportRoutes.js";
import adminStoryCensorRouter from "./adminStoryCensorRoutes.js";

const adminRouter = express.Router();

// Tất cả routes đều yêu cầu admin role
adminRouter.use(requireAdmin);

// Routes
adminRouter.use("/stories", adminStoryCensorRouter);
adminRouter.use("/chapters", adminChapterCensorRouter);
adminRouter.use("/reports", adminReportRouter);
adminRouter.get("/", getAllAdmins);
adminRouter.get("/:id", getAdminById);
adminRouter.post("/", createAdmin);
adminRouter.put("/:id", updateAdmin);
adminRouter.delete("/:id", deleteAdmin);
adminRouter.post("/delete-many", deleteManyAdmins);

export default adminRouter;
