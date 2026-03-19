import type { IStory } from "../interfaces/story.js";
import { CensorLog } from "../models/CensorLog.js";
import { Chapter } from "../models/Chapter.js";
import { Story } from "../models/Story.js";
import * as chapterService from "./chapterService.js";

class AdminStoryCensorService {
  public static async getPendingStories(): Promise<IStory[]> {
    return Story.find({ status: "pending" })
      .populate("authorId", "username email avatar fullName")
      .sort({ createdAt: -1 })
      .lean();
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
}

export default AdminStoryCensorService;
