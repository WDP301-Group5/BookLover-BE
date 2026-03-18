import { Request, Response } from "express";
import ForumService from "../services/ForumService";
import { SUCCESS_OK } from "../consts/successCode";
import { ERR_BAD_REQUEST, ERR_INTERNAL_SERVER } from "../consts/errorCode";
import ForumCategoryService from "../services/ForumCategoryService";
import ForumPostService from "../services/ForumPostService";

export const getAllForums = async (req: Request, res: Response) => {
  try {
    const forums = await ForumService.getAllForums();
    res.status(SUCCESS_OK).json(forums);
  } catch (error) {
    res
      .status(ERR_INTERNAL_SERVER)
      .json({ message: "Error get all forums", error: error });
  }
};

export const getForumBySlug = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const forum = await ForumService.getForumBySlug(slug);
    res.status(SUCCESS_OK).json(forum);
  } catch (error) {
    res
      .status(ERR_INTERNAL_SERVER)
      .json({ message: "Error get forum by slug", error: error });
  }
};

export const createForum = async (req: Request, res: Response) => {
  try {
    const userId = req?.user ? req.user?.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_BAD_REQUEST)
        .json({ message: "Thiếu thông tin người dùng" });
    }
    const { name, description } = req.body;
    const forum = await ForumService.createForum(name, description);
    res.status(SUCCESS_OK).json(forum);
  } catch (error) {
    res
      .status(ERR_INTERNAL_SERVER)
      .json({ message: "Error create forum", error: error });
  }
};

export const getForumCategoryByForumSlug = async (
  req: Request,
  res: Response,
) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const slug = req.params.slug;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const forumCategory = await ForumCategoryService.getForumCatoryOfForum(
      slug,
      String(type),
      offset,
      parseInt(limit as string),
    );
    res.status(SUCCESS_OK).json(forumCategory);
  } catch (error) {
    res
      .status(ERR_INTERNAL_SERVER)
      .json({ message: "Error get forums category", error: error });
  }
};

export const getForumCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    if (!slug || slug == "undefined")
      return res
        .status(ERR_BAD_REQUEST)
        .json({ message: "Thiếu thông tin chủ đề diễn đàn" });
    const forumCategory =
      await ForumCategoryService.getForumCategoryBySlug(slug);
    res.status(SUCCESS_OK).json(forumCategory);
  } catch (error) {
    res
      .status(ERR_INTERNAL_SERVER)
      .json({ message: "Error get forum category", error: error });
  }
};

export const createForumCategory = async (req: Request, res: Response) => {
  try {
    const userId = req.user ? req.user.userId : undefined;
    if (!userId) {
      return res
        .status(ERR_BAD_REQUEST)
        .json({ message: "Không có thông tin người dùng" });
    }
    const { forumId, title, description, storyId, type } = req.body;
    const forumCategory = await ForumCategoryService.createForumCategory(
      forumId,
      userId,
      title,
      description,
      storyId,
      type,
    );
    res.status(SUCCESS_OK).json(forumCategory);
  } catch (error) {
    res
      .status(ERR_INTERNAL_SERVER)
      .json({ message: "Error create forum category", error: error });
  }
};
