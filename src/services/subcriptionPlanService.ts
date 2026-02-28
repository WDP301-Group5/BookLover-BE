import { SubcriptionPlan } from "../models/SubcriptionPlan";

const SubcriptionPlanService = {
	async getAllSubcriptionPlans() {
		try {
			const plans = await SubcriptionPlan.find({ status: "active" }).sort({
				level: 1,
			});
			return plans;
		} catch (error) {
			throw new Error(`Error fetching subscription plans: ${error}`);
		}
	},

	async getCurrentPlanOfUser(userId: string) {
		try {
			const plan = await SubcriptionPlan.findOne({ userId, status: "active" });
			return plan;
		} catch (error) {
			throw new Error(`Error fetching current plan of user: ${error}`);
		}
	},

	async subscribeToPlan(planId: string) {
		try {
			const plan = await SubcriptionPlan.findById(planId);
			if (!plan) {
				throw new Error("Plan not found");
			}
			return plan;
		} catch (error) {
			throw new Error(`Error subscribing to plan: ${error}`);
		}
	},
};

export default SubcriptionPlanService;
