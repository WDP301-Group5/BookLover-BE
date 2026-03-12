import { Router } from "express";
import { verifyToken } from "../middleware/auth";
import { deleteNotification, getMyNotifications, getUnreadCount, markAllAsRead, markAsRead } from "../controllers/notificationController";

const notificationRoutes = Router();

notificationRoutes.get("/", verifyToken, getMyNotifications);
notificationRoutes.get("/unread-count", verifyToken, getUnreadCount);
notificationRoutes.patch("/:id/read", verifyToken, markAsRead);
notificationRoutes.patch("/read-all", verifyToken, markAllAsRead);
notificationRoutes.delete("/:id", verifyToken, deleteNotification);

export default notificationRoutes;