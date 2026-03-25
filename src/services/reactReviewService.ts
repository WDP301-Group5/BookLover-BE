import { ReactReview } from "../models/ReactReview";
import { Review } from "../models/Review";
import reviewService from "./reviewService";

const ReactReviewService = {
	async getUserReactReviews(userId: string, reviewIds: string[]) {
		try {
			const result = await ReactReview.find({
				userId,
				reviewId: { $in: reviewIds },
				react: { $ne: "unlike" },
			}).lean();

			return result.map((item: any) => ({
				...item,
				id: item._id.toString(),
			}));
		} catch (error) {
			throw new Error(
				"Có lỗi xảy ra khi lấy react review của người dùng: " + error,
			);
		}
	},

	async userReactReview(userId: string, reviewId: string, react: string) {
		const review = await Review.findById(reviewId);
		if (!review || review.status !== "active") {
			throw new Error("Review không tồn tại hoặc không khả dụng");
		}

		const isExist = await ReactReview.findOne({ userId, reviewId });

		if (isExist) {
			const oldReact = isExist.react;

			const updated = await ReactReview.findOneAndUpdate(
				{ userId, reviewId },
				{ react },
				{ new: true },
			);

			if (react === "unlike") {
				if (oldReact !== "unlike") {
					await reviewService.updateDecreaseReactReviewCount(
						reviewId,
						oldReact,
					);
				}
			} else {
				if (oldReact !== "unlike") {
					await reviewService.updateDecreaseReactReviewCount(
						reviewId,
						oldReact,
					);
				}
				await reviewService.updateIncreaseReactReviewCount(reviewId, react);
			}

			return updated;
		}

		const newReactReview = new ReactReview({
			userId,
			reviewId,
			react,
		});

		await newReactReview.save();

		if (react !== "unlike") {
			await reviewService.updateIncreaseReactReviewCount(reviewId, react);
		}

		return newReactReview;
	},
};

export default ReactReviewService;
