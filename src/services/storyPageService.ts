// src/services/storyPageService.ts
import type { IStory } from "../interfaces/story";
import { Story } from "../models/Story";
import { slugify } from "../utils/validation";

export async function createStory(data: Partial<IStory>) {
  try {
    const story = new Story({
      ...data,
      slug: slugify(data.title || ""),
    });
    await story.save();
    return story;
  } catch (error) {
    throw error;
  }
}

export async function getStories() {
  try {
    const stories = await Story.find({ status: "active" })
      .sort({ createdAt: -1 })
      .lean<IStory[]>();
    return stories;
  } catch (error) {
    throw error;
  }
}

export async function getStoryById(id: string) {
  try {
    const story = await Story.findById(id).populate("topics").lean<IStory>();
    return story;
  } catch (error) {
    throw error;
  }
}

export async function updateStory(id: string, data: Partial<IStory>) {
  try {
    const story = await Story.findByIdAndUpdate(id, data, {
      new: true,
    }).lean<IStory>();
    return story;
  } catch (error) {
    throw error;
  }
}

export async function deleteStory(id: string) {
  try {
    const result = await Story.findByIdAndDelete(id);
    return result;
  } catch (error) {
    throw error;
  }
}
