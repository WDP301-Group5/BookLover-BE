import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();
mongoose.set("bufferCommands", false);

const MONGO_URI: string =
	process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/WDP301_BookLover";
// nếu server lỗi thì sẽ kết nối đến local

const connectDB = async (): Promise<void> => {
	let timeoutHandle: NodeJS.Timeout | null = null;
	try {
		await Promise.race([
			// Tại promise để connect đến server
			mongoose.connect(MONGO_URI, {
				serverSelectionTimeoutMS: 5000, // Mongo tự timeout
			}),

			// Kiểm tra timeout (ép timeout sau 5s)
			new Promise((_, reject) => {
				timeoutHandle = setTimeout(() => {
					reject(
						new Error(
							"❌❌❌❌❌ Connect to Mongodb server failed. Error timeout after 5s",
						),
					);
				}, 5000);
			}),
		]);
		// Kiểm tra xem kết nối MongoDB Atlas hay MongoDB local
		if (MONGO_URI.includes("srv")) {
			console.log("MongoDB connected successfully! (Server)");
		} else {
			console.log("MongoDB connected successfully! (Local)");
		}
	} catch (err: unknown) {
		if (err instanceof Error) {
			console.error("MongoDB connection failed:", err.message);
		} else {
			console.error("MongoDB connection failed:", err);
		}
		process.exit(1);
	} finally {
		if (timeoutHandle) {
			clearTimeout(timeoutHandle);
		}
	}
};

export default connectDB;
