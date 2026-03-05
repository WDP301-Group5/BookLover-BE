// src/services/chapterPageService.ts
import type { IChapter } from "../interfaces/chapter";
import { Chapter } from "../models/Chapter";

export const createChapter = (data: IChapter) => Chapter.create(data);
export const getChaptersByStory = (storyId: string) =>
	Chapter.find({ storyId, status: "active" }).sort({ chapterNumber: 1 });
export const getChapterById = (id: string) => Chapter.findById(id);
export const updateChapter = (id: string, data: Partial<IChapter>) =>
	Chapter.findByIdAndUpdate(id, data, { new: true });
export const deleteChapter = (id: string) => Chapter.findByIdAndDelete(id);
