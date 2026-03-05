// src/controllers/chapterPageController.ts
import type { Request, Response } from "express";
import * as chapterService from "../services/chapterPageService";

export const createChapter = async (req: Request, res: Response) =>
	res.json(await chapterService.createChapter(req.body));

export const getChaptersByStory = async (req: Request, res: Response) =>
	res.json(await chapterService.getChaptersByStory(req.params.storyId));

export const getChapterById = async (req: Request, res: Response) =>
	res.json(await chapterService.getChapterById(req.params.id));

export const updateChapter = async (req: Request, res: Response) =>
	res.json(await chapterService.updateChapter(req.params.id, req.body));

export const deleteChapter = async (req: Request, res: Response) =>
	res.json(await chapterService.deleteChapter(req.params.id));
