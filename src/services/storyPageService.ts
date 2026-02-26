// src/services/storyPageService.ts
import type { IStory } from "../interfaces/story";
import { Story } from "../models/Story";

export const createStory = (data: IStory) => Story.create(data);
export const getStories = () => Story.find({ status: "active" });
export const getStoryById = (id: string) =>
	Story.findById(id).populate("topics");
export const updateStory = (id: string, data: Partial<IStory>) =>
	Story.findByIdAndUpdate(id, data, { new: true });
export const deleteStory = (id: string) => Story.findByIdAndDelete(id);
