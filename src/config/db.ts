import dotenv from "dotenv";
import { connect } from "mongoose";

dotenv.config();

const MONGO_URI: string =
	process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/WDP301_BookLover";
// nếu server lỗi thì sẽ kết nối đến local

const connectDB = async (): Promise<void> => {
	try {
		await connect(MONGO_URI);
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
	}
};

export default connectDB;
