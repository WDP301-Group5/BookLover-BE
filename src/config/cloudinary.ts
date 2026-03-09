import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imageStorage = new CloudinaryStorage({
	cloudinary,
	params: async (_req, file) => {
		return {
			folder: "WDP301_BookLover/images",
			allowed_formats: ["jpg", "png", "jpeg"],
			public_id: `${Date.now()}-${file.originalname}`,
		};
	},
});

const textStorage = new CloudinaryStorage({
	cloudinary,
	params: async (_req, file) => ({
		folder: "WDP301_BookLover/texts",
		resource_type: "raw",
		public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}${path.extname(file.originalname)}`,
	}),
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
	const allowed = [".txt", ".pdf", ".docx", ".doc", ".html", ".md"];
	const ext = path.extname(file.originalname).toLowerCase();

	if (allowed.includes(ext)) {
		cb(null, true);
	} else {
		cb(new Error("File format không được hỗ trợ"));
	}
};

export const uploadImage = multer({ storage: imageStorage });
export const uploadText = multer({ storage: textStorage, fileFilter });

export const deleteImageFromCloudinary = async (publicId: string) => {
	try {
		await cloudinary.uploader.destroy(publicId);
	} catch (error) {
		console.error("Error deleting image from Cloudinary:", error);
	}
};

export const deleteTextFromCloudinary = async (publicId: string) => {
	try {
		await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
	} catch (error) {
		console.error("Error deleting text from Cloudinary:", error);
	}
};

export const checkConnectCloudinary = async (): Promise<void> => {
	try {
		const result = await cloudinary.api.ping();
		console.log("===========> Cloudinary connected successfully!");
		console.log("Ping result:", result?.status);
	} catch (err: unknown) {
		if (err instanceof Error) {
			console.error("Cloudinary connection failed:", err.message);
		} else {
			console.error("Cloudinary connection failed:", err);
		}
	}
};
