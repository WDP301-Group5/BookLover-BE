import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.CLOUD_API_KEY,
	api_secret: process.env.CLOUD_API_SECRET,
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
	params: async (_req, file) => {
		return {
			folder: "WDP301_BookLover/texts",
			allowed_formats: ["pdf", "docx", "txt", "html", "md", "doc"],
			public_id: `${Date.now()}-${file.originalname}`,
		};
	},
});

export const uploadImage = multer({ storage: imageStorage });
export const uploadText = multer({ storage: textStorage });

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
