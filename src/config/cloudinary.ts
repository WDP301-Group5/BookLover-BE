import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { convertFileToHtml } from "../utils/convertFileToHTML";

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

export const uploadHTMLToCloudinary = async (
	html: string,
	fileName: string,
) => {
	const base64 = Buffer.from(html).toString("base64");

	const result = await cloudinary.uploader.upload(
		`data:text/html;base64,${base64}`,
		{
			folder: "WDP301_BookLover/texts",
			resource_type: "raw",
			public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, "")}.html`,
		},
	);

	return result;
};

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
	const allowed = [".txt", ".pdf", ".docx", ".doc", ".html", ".md"];
	const ext = path.extname(file.originalname).toLowerCase();

	if (allowed.includes(ext)) {
		cb(null, true);
	} else {
		cb(new Error("File format không được hỗ trợ"));
	}
};

export const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 50 * 1024 * 1024 },
});

export const uploadImage = multer({
	storage: imageStorage,
	limits: { fileSize: 10 * 1024 * 1024 },
}); // 10MB

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
