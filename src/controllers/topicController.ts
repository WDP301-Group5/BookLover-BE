import { Request, Response } from "express";
import TopicService from "../services/TopicService";

export const getTopics = async (req: Request, res: Response) => {
  try {
    const topics = await TopicService.getAllTopics();
    res.json({ topics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách topics" });
  }
};

export const createTopic = async (req: Request, res: Response) => {
  try {
    const topic = await TopicService.createTopic(req.body);
    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo topic" });
  }
};

export const updateTopic = async (req: Request, res: Response) => {
  try {
    const topic = await TopicService.updateTopic(req.params.id, req.body);
    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật topic" });
  }
};

export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const result = await TopicService.deleteTopic(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa topic" });
  }
};