import { Request, Response, Router } from "express";
import {
	ERR_BAD_REQUEST,
	ERR_SERVICE_UNAVAILABLE,
} from "../consts/errorCode.js";
import { uploadStoryImage } from "../middleware/upload.js";

const uploadRouter = Router();

/**
 * POST /upload/image
 * Upload a single image and return the URL
 */
uploadRouter.post("/image", uploadStoryImage, (req: Request, res: Response) => {
	try {
		if (!req.file) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ error: "Chưa có ảnh được gửi lên" });
		}

		// req.file.path will contain Cloudinary URL when using CloudinaryStorage
		const imageUrl = req.file.path;

		return res.status(200).json({
			success: true,
			message: "Upload ảnh thành công",
			path: imageUrl,
			url: imageUrl,
			imageUrl: imageUrl,
		});
	} catch (error) {
		console.error("Upload image error:", error);
		return res.status(ERR_SERVICE_UNAVAILABLE).json({
			error: "Lỗi upload ảnh",
			errorDetail: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

export default uploadRouter;
