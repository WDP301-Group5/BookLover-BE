import { StoryView } from "../models/StoryView";

const StoryViewService = {
	async addNewView(storyId: string) {
		try {
			const newView = new StoryView({
				storyId,
			});
			await newView.save();
			return newView;
		} catch (error) {
			throw new Error(`Error adding new story view: ${error}`);
		}
	},
};

export default StoryViewService;
