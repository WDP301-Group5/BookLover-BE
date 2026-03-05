declare namespace NodeJS {
	export interface ProcessEnv {
		PORT: string;
		BASE_URL: string;

		// MongoDB
		MONGO_URI: string;
		MONGO_URI_LOCAL: string;
		ATLAS_USER: string;
		ATLAS_PASSWORD: string;

		// Redis
		REDIS_HOST: string;
		REDIS_PORT: number;
		REDIS_USERNAME: string;
		REDIS_PASSWORD: string;

		// JWT & Auth
		JWT_SECRET: string;
		JWT_ACCESS_SECRET: string;
		JWT_REFRESH_SECRET: string;
		AUTH_TOKEN: string;

		// Cloudinary
		CLOUDINARY_CLOUD_NAME: string;
		CLOUDINARY_URL: string;
		CLOUD_NAME: string;
		CLOUD_API_KEY: string;
		CLOUD_API_SECRET: string;

		// ZaloPay
		ZALOPAY_APP_ID: string;
		ZALOPAY_KEY1: string;
		ZALOPAY_KEY2: string;
		ZALOPAY_ENDPOINT: string;
		ZALOPAY_RETURN_URL: string;
		ZALOPAY_CALLBACK_URL: string;

		// Systems / Orders
		PAYMENT_SECURED_KEY: string;
		PAYMENT_TIMEOUT_MS: string;
		CARRIER_API_KEY: string;
		AUTO_CANCEL_MINUTES: string;

		// Email
		EMAIL_PORT: string;
		EMAIL_HOST: string;
		EMAIL_USER: string;
		EMAIL_PASS: string;
		EMAIL_DISABLED: string;

		// Google
		GOOGLE_CLIENT_ID: string;
	}
}
