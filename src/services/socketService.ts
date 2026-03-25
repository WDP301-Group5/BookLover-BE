import type { Server, Socket } from "socket.io";
import {
	CHATING_USER_KEY,
	JOIN_ROOM_KEY,
	RECEIVE_MESSAGE_KEY,
	SEND_MESSAGE_KEY,
	USER_ROOM_KEY,
} from "../consts/socket";
import ChatingService from "./ChatingService";
import UserService from "./userService";

const socketHandler = async (io: Server, socket: Socket, userId: string) => {
	const room = `${USER_ROOM_KEY}_${userId}`;
	socket.join(room);
	const sockets = await io.in(room).fetchSockets();

	if (sockets.length === 1) {
		await UserService.updateUserOnline(userId);
	}

	socket.on(JOIN_ROOM_KEY, (conversationId: string) => {
		socket.join(`${JOIN_ROOM_KEY}_${conversationId}`);
	});

	socket.on(
		SEND_MESSAGE_KEY,
		async (data: {
			conversationId: string;
			tempId: string;
			content: string;
		}) => {
			//  hàm sử lý dữ liệu message nhận từ frontend
			const message = await ChatingService.createMessage(
				data.conversationId,
				userId,
				data.content,
			);

			await ChatingService.updateConversation(data.conversationId, message._id);

			io.to(`${JOIN_ROOM_KEY}_${data.conversationId}`).emit(
				RECEIVE_MESSAGE_KEY,
				{
					// gửi broadcast cho mọi người trong phòng
					id: message._id.toString(),
					tempId: data.tempId,
					conversationId: data.conversationId,
					senderId: userId,
					content: data.content,
					createdAt: message.createdAt,
				},
			);

			// nếu muốn chỉ gửi cho người khác thì dùng:
			// socket.broadcast.emit("receive_message", data);
		},
	);

	socket.on("join_purchase_room", (app_trans_id: string) => {
		console.log("join_purchase_room", socket.id, app_trans_id);
		socket.join(`purchase_room_${app_trans_id}`);
	});

	socket.on("leave_purchase_room", (app_trans_id: string) => {
		console.log("leave_purchase_room", socket.id, app_trans_id);
		socket.leave(`purchase_room_${app_trans_id}`);
	});
};

export default socketHandler;
