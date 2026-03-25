import express from "express";
import { AdminDashboardController } from "../controllers/adminDashboardController.js";

const adminDashboardRoutes = express.Router();

adminDashboardRoutes.get("/overview", AdminDashboardController.getOverview);

export default adminDashboardRoutes;
