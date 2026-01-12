import type { NextFunction, Request, Response } from "express";
import { uploadImage, uploadText } from "../config/cloudinary.js";
import {
	ERR_BAD_REQUEST,
	ERR_SERVICE_UNAVAILABLE,
} from "../consts/errorCode.js";

// Middleware upload một file ảnh
export const uploadStoryImage = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	uploadImage.single("image")(req, res, (err) => {
		if (err) {
			console.error("Upload lỗi:", err);
			return res
				.status(ERR_SERVICE_UNAVAILABLE)
				.json({ error: "Lỗi upload ảnh ", errorDetail: err?.message });
		}

		if (!req.file) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ error: "Chưa có ảnh được gửi lên" });
		}
		req.body.image = req.file.path;

		// Nếu upload thành công => gọi next()
		next();
	});
};

export const uploadAvatarURL = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	uploadImage.single("avatarURL")(req, res, (err) => {
		if (err) {
			console.error("Upload lỗi:", err);
			return res
				.status(ERR_SERVICE_UNAVAILABLE)
				.json({ error: "Lỗi upload ảnh ", errorDetail: err?.message });
		}

		if (
			typeof req.body.avatarURL === "string" &&
			req.body.avatarURL.trim() !== "" &&
			!req.file
		) {
			return next();
		}

		if (!req.file) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ error: "Chưa có ảnh được gửi lên" });
		}

		req.body.avatarURL = req.file.path;

		// Nếu upload thành công => gọi next()
		next();
	});
};

export const uploadBackgroundURL = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	uploadImage.single("backgroundURL")(req, res, (err) => {
		if (err) {
			console.error("Upload lỗi:", err);
			return res
				.status(ERR_SERVICE_UNAVAILABLE)
				.json({ error: "Lỗi upload ảnh ", errorDetail: err?.message });
		}

		if (
			typeof req.body.backgroundURL === "string" &&
			req.body.backgroundURL.trim() !== "" &&
			!req.file
		) {
			return next();
		}

		if (!req.file) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ error: "Chưa có ảnh được gửi lên" });
		}

		req.body.backgroundURL = req.file.path;

		// Nếu upload thông => gọi next()
		next();
	});
};

export const uploadAvatarAndBackground = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	// Cho phép upload 2 trường ảnh: 'avatarURL' và 'backgroundURL'
	if (req.body.avatarURL && req.body.backgroundURL) {
		uploadImage.fields([
			{ name: "avatarURL", maxCount: 1 },
			{ name: "backgroundURL", maxCount: 1 },
		])(req, res, (err) => {
			if (err) {
				console.error("Upload lỗi:", err);
				return res
					.status(ERR_SERVICE_UNAVAILABLE)
					.json({ error: "Lỗi upload ảnh", errorDetail: err.message });
			}

			// Nếu ảnh mới được upload, gán đường dẫn vào req.body
			const files = req.files as {
				[fieldname: string]: Express.Multer.File[];
			};

			if (files?.avatar?.[0]) {
				req.body.avatar = files.avatar[0].path;
			} else if (
				typeof req.body.avatar === "string" &&
				req.body.avatar.trim() !== ""
			) {
				// Giữ ảnh cũ
				console.log("Giữ nguyên avatar:", req.body.avatar);
			} else {
				req.body.avatar = null; // hoặc bỏ qua nếu cần
			}

			if (files?.backgroundImage?.[0]) {
				req.body.backgroundImage = files.backgroundImage[0].path;
			} else if (
				typeof req.body.backgroundImage === "string" &&
				req.body.backgroundImage.trim() !== ""
			) {
				// Giữ ảnh cũ
				console.log("Giữ nguyên background:", req.body.backgroundImage);
			} else {
				req.body.backgroundImage = null;
			}

			// Tiếp tục xử lý
			next();
		});
	} else {
		// Nếu không có cả 2 trường, bỏ qua middleware này
		next();
	}
};

export const uploadTextFile = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	uploadText.single("file")(req, res, (err) => {
		if (err) {
			console.error("Upload lỗi:", err);
			return res
				.status(ERR_SERVICE_UNAVAILABLE)
				.json({ error: "Lỗi upload file", errorDetail: err.message });
		}

		if (
			typeof req.body.contentURL === "string" &&
			req.body.contentURL.trim() !== "" &&
			!req.file
		) {
			return next();
		}

		if (!req.file) {
			return res
				.status(ERR_BAD_REQUEST)
				.json({ error: "Chưa có file được gửi lên" });
		}

		req.body.file = req.file.path;

		// Nếu upload thành công => gọi next()
		next();
	});
};
