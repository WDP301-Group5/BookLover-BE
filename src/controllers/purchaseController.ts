import type { Request, Response } from "express";
import { ERR_INTERNAL_SERVER } from "../consts/errorCode";
import SubcriptionPlanService from "../services/subcriptionPlanService";

export const getPurchasePlans = async (_req: Request, res: Response) => {
	try {
		const plans = await SubcriptionPlanService.getAllSubcriptionPlans();
		res.json(plans);
	} catch (error) {
		res.status(ERR_INTERNAL_SERVER).json({ error: (error as Error).message });
	}
};

export const subscribeToPlan = async (req: Request, res: Response) => {
	try {
		const { planId } = req.body;
		const result = await SubcriptionPlanService.subscribeToPlan(planId);
		res.json(result);
	} catch (error) {
		res.status(ERR_INTERNAL_SERVER).json({ error: (error as Error).message });
	}
};
