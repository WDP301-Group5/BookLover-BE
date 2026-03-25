// src/app.ts
import { createServer } from "node:http";
import cors from "cors";
import dotenv from "dotenv";
import express, {
	json as bodyParser,
	type Request,
	type Response,
} from "express";
import morgan from "morgan";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import { apiRateLimit } from "./config/rateLimit.js";
import client from "./config/redis.js";
import routes from "./routes/index.js";
import socketHandler from "./services/socketService.js";
import "./models/index.js";
import { checkConnectCloudinary } from "./config/cloudinary.js";
import { USER_ROOM_KEY } from "./consts/socket.js";
import UserService from "./services/userService.js";

// Load biến môi trường
dotenv.config();

checkConnectCloudinary();

// Kết nối MongoDB
await connectDB();
const app = express();
app.use(bodyParser());

const corsOptions = {
	origin: "*",
};
app.use(cors(corsOptions));

// setup terminal logger
app.use(morgan("combined"));

app.use(express.json());

app.set("trust proxy", 1);

// Route test
app.get("/", (req: Request, res: Response) => {
	console.log("Request", req);
	res.send({ message: "Welcome to Practical Exam!" });
});

app.use("/api", apiRateLimit);

app.use("/api/v1", routes);

client.on("connect", () => {
	console.log("Redis connected");
});

// Create an HTTP server using the Express app
const httpServer = createServer(app);

// Initialize Socket.IO with the HTTP server
export const io = new Server(httpServer, {
	cors: corsOptions, // Use the same CORS options
});

// Socket.IO connection handler
io.on("connection", (socket) => {
	console.log("A user connected:", socket.id);

	const userId = socket.handshake.auth.userId as string;

	if (userId) socketHandler(io, socket, userId);

	// Handle disconnection
	socket.on("disconnect", async () => {
		const userId = socket.handshake.auth.userId as string;

		if (!userId) return;

		const room = `${USER_ROOM_KEY}_${userId}`;

		setTimeout(async () => {
			const sockets = await io.in(room).fetchSockets();

			if (sockets.length === 0) {
				await UserService.updateUserOffline(userId);
			}
		}, 5000);
		console.log("A user disconnected:", socket.id);
	});
});

export default httpServer;
