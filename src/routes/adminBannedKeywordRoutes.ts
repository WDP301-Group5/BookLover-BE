import express from "express";
import {
	createBannedKeyword,
	deleteBannedKeyword,
	getAllBannedKeywords,
	getBannedKeywordById,
	updateBannedKeyword,
} from "../controllers/adminBannedKeywordController.js";

const adminBannedKeywordRouter = express.Router();

adminBannedKeywordRouter.get("/", getAllBannedKeywords);
adminBannedKeywordRouter.get("/:id", getBannedKeywordById);
adminBannedKeywordRouter.post("/", createBannedKeyword);
adminBannedKeywordRouter.put("/:id", updateBannedKeyword);
adminBannedKeywordRouter.delete("/:id", deleteBannedKeyword);

export default adminBannedKeywordRouter;
