// src/controllers/storyPageController.ts
import type { Request, Response } from "express";
import * as storyService from "../services/storyPageService";

export const createStory = async (req: Request, res: Response) =>
	res.json(await storyService.createStory(req.body));

export const getStories = async (_: Request, res: Response) =>
	res.json(await storyService.getStories());

export const getStoryById = async (req: Request, res: Response) =>
	res.json(await storyService.getStoryById(req.params.id));

export const updateStory = async (req: Request, res: Response) =>
	res.json(await storyService.updateStory(req.params.id, req.body));

export const deleteStory = async (req: Request, res: Response) =>
	res.json(await storyService.deleteStory(req.params.id));
