import { Topic } from "../models/Topic";

const TopicService = {
	async getTopics() {
		return Topic.find({ status: "active" }).sort({ name: 1 });
	},
};

export default TopicService;
// temp comment to force git detect change