import type { IChapter } from "../interfaces/chapter";
import { Chapter } from "../models/Chapter";
import { User } from "../models/User";

/**
 * Extract plain text from HTML and count words
 */
export const countWordsFromHtml = (html: string): number => {
  // Remove HTML tags
  const plain = html.replace(/<[^>]+>/g, " ").trim();
  // Split by whitespace and filter empty strings
  const words = plain.split(/\s+/).filter((w) => w.length > 0);
  return words.length;
};

export const createChapter = async (data: IChapter) => {
  const chapter = await Chapter.create(data);
  return {
    ...chapter.toObject(),
    id: chapter._id.toString(),
  };
};

export const createChaptersBatch = async (
  chapters: Partial<IChapter>[],
): Promise<any> => {
  try {
    if (!chapters || chapters.length === 0) {
      throw new Error("Danh sách chương không thể trống");
    }

    // Validate all chapters before creating
    const invalidChapters: string[] = [];
    chapters.forEach((chapter, index) => {
      if (!chapter.storyId) {
        invalidChapters.push(`Chương ${index + 1}: Story ID là bắt buộc`);
      }
      if (!chapter.chapterNumber) {
        invalidChapters.push(`Chương ${index + 1}: Số chương là bắt buộc`);
      }
      if (!chapter.title) {
        invalidChapters.push(`Chương ${index + 1}: Tiêu đề chương là bắt buộc`);
      }
      if (!chapter.contentURL) {
        invalidChapters.push(`Chương ${index + 1}: URL nội dung là bắt buộc`);
      }
    });

    if (invalidChapters.length > 0) {
      throw new Error(`Validation error: ${invalidChapters.join("; ")}`);
    }

    // Create chapters in batch
    const createdChapters = await Chapter.insertMany(chapters, {
      ordered: false, // Continue inserting even if one fails
    });

    // Convert _id to id for each chapter
    const chaptersWithId = createdChapters.map((chapter) => ({
      ...chapter.toObject(),
      id: chapter._id.toString(),
    }));

    return {
      success: true,
      message: `Tạo thành công ${createdChapters.length} chương`,
      data: chaptersWithId,
      count: createdChapters.length,
    };
  } catch (error) {
    console.error("Error in createChaptersBatch:", error);
    throw error;
  }
};

export const getChaptersByStory = async (storyId: string) => {
  try {
    const chapters = await Chapter.find({ storyId, status: "active" }).sort({
      chapterNumber: 1,
    });
    return chapters;
  } catch (error) {
    throw new Error(`Có lỗi xảy ra khi lấy danh sách chương: ${error}`);
  }
};

export const getChaptersByStoryForAuthor = async (storyId: string) => {
  try {
    const chapters = await Chapter.find({ storyId }).sort({ chapterNumber: 1 });
    return chapters;
  } catch (error) {
    throw new Error(`Có lỗi xảy ra khi lấy danh sách chương: ${error}`);
  }
};

export const updateChapterStatusByStory = async (
  storyId: string,
  fromStatus: string,
  toStatus: string,
) => {
  return Chapter.updateMany(
    { storyId, status: fromStatus },
    { $set: { status: toStatus } },
  );
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

export const getChapterByChapterNumberForAuthor = async (
  storyId: string,
  chapterNumber: number,
) => {
  try {
    if (Number.isNaN(chapterNumber) || chapterNumber < 0) {
      throw new Error("Số chương không hợp lệ.");
    }
    const chapter = await Chapter.findOne({ storyId, chapterNumber });
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

export const getPriceOfChapter = async (chapterId: string) => {
  const chapter = await Chapter.findById(chapterId).select("price").lean();
  return chapter?.price || 0;
};

export const submitChapterForReview = async (chapterId: string) => {
  return Chapter.findOneAndUpdate(
    { _id: chapterId, status: "draft" },
    { $set: { status: "pending" } },
    { new: true },
  );
};
