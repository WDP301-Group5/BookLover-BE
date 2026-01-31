import { Story } from "../models/Story";
import { StoryView } from "../models/StoryView";

const StoryViewService = {
	async addNewView(storyId: string, chapterId: string) {
		try {
			const newView = new StoryView({
				storyId,
				chapterId,
			});
			await newView.save();
			await Story.findByIdAndUpdate(storyId, { $inc: { views: 1 } });
			return newView;
		} catch (error) {
			throw new Error(`Error adding new story view: ${error}`);
		}
	},
};

export default StoryViewService;
