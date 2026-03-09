import type { IChapter } from "../interfaces/chapter";
import { Chapter } from "../models/Chapter";

export const createChapter = (data: IChapter) => Chapter.create(data);
export const getChaptersByStory = (storyId: string) => {
	try {
		const chapters = Chapter.find({ storyId, status: "active" }).sort({
			chapterNumber: 1,
		});
		return chapters;
	} catch (error) {
		throw new Error(`Có lỗi xảy ra khi lấy danh sách chương: ${error}`);
	}
};
export const getChapterByChapterNumber = async (
	storyId: string,
	chapterNumber: number,
) => {
	try {
		if (Number.isNaN(chapterNumber) || chapterNumber < 0) {
			throw new Error("Số chương không hợp lệ.");
		}
		const chapter = await Chapter.findOne({
			storyId,
			chapterNumber,
			status: "active",
		});
		if (chapter) {
			chapter.id = chapter._id.toString();
		}
		return chapter;
	} catch (error) {
		throw new Error(`Có lỗi xảy ra khi lấy thông tin chương: ${error}`);
	}
};
export const updateChapter = (id: string, data: Partial<IChapter>) =>
	Chapter.findByIdAndUpdate(id, data, { new: true });
export const deleteChapter = (id: string) => Chapter.findByIdAndDelete(id);
export const getChapterById = (id: string) => Chapter.findById(id);
