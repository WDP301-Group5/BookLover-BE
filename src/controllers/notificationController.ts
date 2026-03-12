
import type { Request, Response } from "express";
import notificationService from "../services/notificationService";

export const getMyNotifications = async (req: Request, res: Response) => {
    try {
        console.log("req.user =", (req as any).user);

    const userId = (req as any).user?.userId;
    console.log("userId =", userId);

        const result = await notificationService.getMyNotifications({
            userId,
            page: Number(req.query.page || 1),
            limit: Number(req.query.limit || 10),
            status: req.query.status as "read" | "unread" | undefined,
        });

        return res.status(200).json({
            message: "Get notifications successfully",
            data: result,
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message || "Internal server error",
        });
    }
};

export const getUnreadCount = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        const result = await notificationService.getUnreadCount(userId);

        return res.status(200).json({
            message: "Get unread count successfully",
            data: result,
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message || "Internal server error",
        });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        const result = await notificationService.markAsRead(id, userId);

        return res.status(200).json({
            message: "Mark notification as read successfully",
            data: result,
        });
    } catch (error: any) {
        return res.status(404).json({
            message: error.message || "Notification not found",
        });
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        const result = await notificationService.markAllAsRead(userId);

        return res.status(200).json({
            message: result.message,
        });
    } catch (error: any) {
        return res.status(500).json({
            message: error.message || "Internal server error",
        });
    }
};

export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        const result = await notificationService.deleteNotification(id, userId);

        return res.status(200).json({
            message: result.message,
        });
    } catch (error: any) {
        return res.status(404).json({
            message: error.message || "Notification not found",
        });
    }
};