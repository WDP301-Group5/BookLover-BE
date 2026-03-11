import { Topic } from "../models/Topic";
import type { ITopic } from "../interfaces/topic";

const TopicService = {
  // Lấy tất cả topics
  async getAllTopics(): Promise<ITopic[]> {
    try {
      const topics = await Topic.find({ status: "active" }).lean();
      return topics;
    } catch (error) {
      console.error("Error fetching topics:", error);
      throw new Error("Error fetching topics");
    }
  },

  async getTopics() {
    return Topic.find({ status: "active" }).sort({ name: 1 });
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

  // Delete topic
  async deleteTopic(id: string) {
    try {
      await Topic.findByIdAndDelete(id);
      return { message: "Topic deleted successfully" };
    } catch (error) {
      console.error("Error deleting topic:", error);
      throw new Error("Error deleting topic");
    }
  },
};

export default TopicService;
