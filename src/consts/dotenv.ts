import "dotenv/config";

export const DOTENV = {
	// express
	PORT: process.env.PORT,
	BASE_URL: process.env.BASE_URL,
	// cloudinary
	CLOUD_NAME: process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
	CLOUD_API_KEY: process.env.CLOUD_API_KEY || process.env.CLOUDINARY_API_KEY,
	CLOUD_API_SECRET:
		process.env.CLOUD_API_SECRET || process.env.CLOUDINARY_API_SECRET,
	CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
	CLOUDINARY_URL: process.env.CLOUDINARY_URL,
	// mongo
	MONGO_URI: process.env.MONGO_URI,
	MONGO_URI_LOCAL: process.env.MONGO_URI_LOCAL,
	ATLAS_USER: process.env.ATLAS_USER,
	ATLAS_PASSWORD: process.env.ATLAS_PASSWORD,
	// redis
	REDIS_HOST: process.env.REDIS_HOST,
	REDIS_PORT: process.env.REDIS_PORT,
	REDIS_USERNAME: process.env.REDIS_USERNAME,
	REDIS_PASSWORD: process.env.REDIS_PASSWORD,
	// email
	EMAIL_HOST: process.env.EMAIL_HOST,
	EMAIL_PORT: process.env.EMAIL_PORT,
	EMAIL_USER: process.env.EMAIL_USER,
	EMAIL_PASS: process.env.EMAIL_PASS,
	EMAIL_DISABLED: process.env.EMAIL_DISABLED,
	// google
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
	// jwt & auth
	JWT_SECRET: process.env.JWT_SECRET,
	JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
	JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
	AUTH_TOKEN: process.env.AUTH_TOKEN,
	// zalopay
	ZALOPAY_APP_ID: process.env.ZALOPAY_APP_ID,
	ZALOPAY_KEY1: process.env.ZALOPAY_KEY1,
	ZALOPAY_KEY2: process.env.ZALOPAY_KEY2,
	ZALOPAY_ENDPOINT: process.env.ZALOPAY_ENDPOINT,
	ZALOPAY_RETURN_URL: process.env.ZALOPAY_RETURN_URL,
	ZALOPAY_CALLBACK_URL: process.env.ZALOPAY_CALLBACK_URL,
	// systems / orders
	PAYMENT_SECURED_KEY: process.env.PAYMENT_SECURED_KEY,
	PAYMENT_TIMEOUT_MS: process.env.PAYMENT_TIMEOUT_MS,
	CARRIER_API_KEY: process.env.CARRIER_API_KEY,
	AUTO_CANCEL_MINUTES: process.env.AUTO_CANCEL_MINUTES,
	// AI Moderation
	AI_MODERATION_ENABLED: process.env.AI_MODERATION_ENABLED === "true",
	GEMINI_API_KEY: process.env.GEMINI_API_KEY,
} as const;
