import { Topic } from "../models/Topic";
import type { ITopic } from "../interfaces/topic";
import { getTopics } from "../controllers/topicController";

const TopicService = {
  // Lấy tất cả topics
  async getAllTopics(): Promise<ITopic[]> {
    try {
      const topics = await Topic.find().lean();
      return topics;
    } catch (error) {
      console.error("Error fetching topics:", error);
      throw new Error("Error fetching topics");
    }
  },

  async getTopics (): Promise<ITopic[]> {
    try {
      const topics = await Topic.find({ status: "active" }).lean();
      return topics;
    } catch (error) {
      console.error("Error fetching topics:", error);
      throw new Error("Error fetching topics");
    }
  },

  async getOneTopic(id: string): Promise<ITopic | null> {
    try {
      const topic = await Topic.findById(id).lean();
      return topic;
    } catch (error) {
      console.error("Error fetching topic:", error);
      throw new Error("Error fetching topic");
    }
  },

  // Tạo topic mới
  async createTopic(data: Partial<ITopic>) {
    try {
      const topic = await Topic.create(data);
      return topic;
    } catch (error) {
      console.error("Error creating topic:", error);
      throw new Error("Error creating topic");
    }
  },

  // Update topic
  async updateTopic(id: string, data: Partial<ITopic>) {
    try {
      const topic = await Topic.findByIdAndUpdate(id, data, { new: true });
      return topic;
    } catch (error) {
      console.error("Error updating topic:", error);
      throw new Error("Error updating topic");
    }
  },

  async deleteManyTopics(ids: string[]) {
    try {
      const topics = await Topic.updateMany({ _id: { $in: ids } }, { status: "inactive" });
      return topics;
    } catch (error) {
      console.error("Error deleting topics:", error);
      throw new Error("Error deleting topics");
    }
  },

  // Delete topic
  // chỉ xóa mềm
  async deleteTopic(id: string) {
    try {
      await Topic.findByIdAndUpdate(id, {status: "inactive"}, { new: true });
      return { message: "Topic deleted successfully" };
    } catch (error) {
      console.error("Error deleting topic:", error);
      throw new Error("Error deleting topic");
    }
  },
};

export default TopicService;