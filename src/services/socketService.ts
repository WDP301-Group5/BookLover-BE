import type { Server, Socket } from "socket.io";

const socketHandler = (io: Server, socket: Socket) => {
	// nhận dữ liệu từ client có key của sự kiện là "send_message"
	socket.on("send_message", (data: unknown) => {
		console.log("Recieve data", data);

		// gửi lại dữ liệu khác cho tất cả client với key của sự kiện là "receive_message"
		// gửi lại cho tất cả client (bao gồm cả người gửi)
		io.emit("receive_message", data);

		// nếu muốn chỉ gửi cho người khác thì dùng:
		// socket.broadcast.emit("receive_message", data);
	});

	socket.on("join_purchase_room", (app_trans_id: string) => {
		console.log("join_purchase_room", socket.id, app_trans_id);
		socket.join(`purchase_room_${app_trans_id}`);
	});
};

export default socketHandler;
