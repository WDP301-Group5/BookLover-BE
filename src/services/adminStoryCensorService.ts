import type { IStory } from "../interfaces/story.js";
import { CensorLog } from "../models/CensorLog.js";
import { Chapter } from "../models/Chapter.js";
import { Story } from "../models/Story.js";
import AIAnalysisService from "./aiAnalysisService.js";
import * as chapterService from "./chapterService.js";

class AdminStoryCensorService {
  public static async getPendingStories(
    runAIAnalysis: boolean = false,
  ): Promise<IStory[]> {
    const stories = await Story.find({ status: "pending" })
      .populate("authorId", "username email avatar fullName")
      .populate("topics", "name")
      .sort({ createdAt: -1 })
      .lean();

    if (runAIAnalysis && stories.length > 0) {
      // Run AI analysis for each pending story that doesn't have one yet
      const storiesWithAI = await Promise.all(
        stories.map(async (story) => {
          const existingAnalysis = await AIAnalysisService.getAnalysisByStoryId(
            story._id.toString(),
          );
          if (!existingAnalysis) {
            try {
              const genres = story.genres
                ? (story.genres as unknown as { name: string }[])
                    .map((g) => g.name)
                    .join(", ")
                : "";
              const analysisResult =
                await AIAnalysisService.analyzeStoryMetadata(
                  story._id.toString(),
                  story.title,
                  story.description,
                  genres,
                );
              return {
                ...story,
                aiAnalysis: analysisResult.aiAnalysis,
                aiDecision: analysisResult.decision,
              };
            } catch (error) {
              console.error(`Failed to analyze story ${story._id}:`, error);
              return story;
            }
          }
          return {
            ...story,
            aiAnalysis: existingAnalysis,
            aiDecision: existingAnalysis.finalDecision,
          };
        }),
      );
      return storiesWithAI as unknown as IStory[];
    }

    return stories;
  }

  public static async getManagedStories(): Promise<IStory[]> {
    return Story.find({ status: { $in: ["active", "banned"] } })
      .populate("authorId", "username email avatar fullName")
      .sort({ createdAt: -1 })
      .lean();
  }

  public static async approveStory(
    storyId: string,
    adminId: string,
  ): Promise<IStory | null> {
    const story = await Story.findOneAndUpdate(
      { _id: storyId, status: "pending" },
      { status: "active" },
      { new: true },
    );

    if (story) {
      await CensorLog.create({
        targetType: "Story",
        storyId,
        adminId,
        action: "approve",
      });
    }

    return story;
  }

  public static async rejectStory(
    storyId: string,
    adminId: string,
    reason: string,
  ): Promise<IStory | null> {
    const story = await Story.findOneAndUpdate(
      { _id: storyId, status: "pending" },
      { status: "rejected" },
      { new: true },
    );

    if (story) {
      // Cascade: set all chapters to "rejected" status
      await chapterService.updateChapterStatusByStory(
        storyId,
        ["draft", "pending", "active"],
        "rejected",
      );

      await CensorLog.create({
        targetType: "Story",
        storyId,
        adminId,
        action: "reject",
        reason,
      });
    }

    return story;
  }

  public static async banStory(
    storyId: string,
    adminId: string,
    reason: string,
  ): Promise<IStory | null> {
    const story = await Story.findOneAndUpdate(
      { _id: storyId, status: "active" },
      { status: "banned" },
      { new: true },
    );

    if (story) {
      // Cascade: set all chapters to "banned" status
      await chapterService.updateChapterStatusByStory(
        storyId,
        ["draft", "pending", "active"],
        "banned",
      );

      await CensorLog.create({
        targetType: "Story",
        storyId,
        adminId,
        action: "ban",
        reason,
      });
    }

    return story;
  }

  public static async unbanStory(
    storyId: string,
    adminId: string,
  ): Promise<IStory | null> {
    const story = await Story.findOneAndUpdate(
      { _id: storyId, status: "banned" },
      { status: "active" },
      { new: true },
    );

    if (story) {
      // Cascade: set all chapters from "banned" back to "active"
      await chapterService.updateChapterStatusByStory(
        storyId,
        "banned",
        "active",
      );

      await CensorLog.create({
        targetType: "Story",
        storyId,
        adminId,
        action: "unban",
      });
    }

    return story;
  }

  public static async getStoryCensorLog(storyId: string) {
    return CensorLog.find({ targetType: "Story", storyId })
      .populate("adminId", "username email avatar fullName")
      .sort({ createdAt: -1 })
      .lean();
  }

  public static async getStoryChapters(storyId: string) {
    return Chapter.find({ storyId }).sort({ chapterNumber: 1 }).lean();
  }

  /**
   * Run AI analysis on a specific story
   */
  public static async analyzeStory(storyId: string): Promise<{
    story: IStory | null;
    analysis: Awaited<
      ReturnType<typeof AIAnalysisService.analyzeStoryMetadata>
    >;
  } | null> {
    const story = await Story.findById(storyId)
      .populate("authorId", "username email avatar fullName")
      .populate("topics", "name")
      .lean();

    if (!story) {
      return null;
    }

    const topics = story.topics
      ? (story.topics as unknown as { name: string }[])
          .map((t) => t.name)
          .join(", ")
      : "";

    const analysis = await AIAnalysisService.analyzeStoryMetadata(
      storyId,
      story.title,
      story.description,
      topics,
    );

    return { story: story as unknown as IStory, analysis };
  }

  /**
   * Get AI analysis result for a specific story
   */
  public static async getStoryAIAnalysis(storyId: string) {
    return AIAnalysisService.getAnalysisByStoryId(storyId);
  }
}

export default AdminStoryCensorService;
