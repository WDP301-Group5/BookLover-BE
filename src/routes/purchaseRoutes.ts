import express from "express";
import { getPurchasePlans } from "../controllers/purchaseController";

const purchaseRoutes = express.Router();

purchaseRoutes.get("/plans", getPurchasePlans);
// purchaseRoutes.post('/subscribe');

export default purchaseRoutes;
