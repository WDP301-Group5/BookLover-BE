import mongoose from "mongoose";
import redisClient from "../config/redis.js";
import type { IBannedKeyword } from "../interfaces/bannedKeyword.js";
import { BannedKeyword } from "../models/BannedKeyword.js";

const REDIS_KEY = "banned_keywords:all";

class BannedKeywordService {
	static async getAllKeywords(): Promise<IBannedKeyword[]> {
		try {
			const cached = await redisClient.get(REDIS_KEY);
			if (cached) {
				return JSON.parse(cached);
			}
			const keywords = await BannedKeyword.find({ isActive: true }).lean();
			await redisClient.setEx(REDIS_KEY, 3600, JSON.stringify(keywords));
			return keywords;
		} catch {
			return BannedKeyword.find({ isActive: true }).lean();
		}
	}

	static async getKeywordsByCategory(
		category: string,
	): Promise<IBannedKeyword[]> {
		const keywords = await this.getAllKeywords();
		return keywords.filter((k) => k.category === category);
	}

	static async createKeyword(
		data: Partial<IBannedKeyword> & {
			text: string;
			category: string;
			createdBy: mongoose.Types.ObjectId;
		},
	): Promise<IBannedKeyword> {
		const keyword = await BannedKeyword.create(data);
		await this.invalidateCache();
		return keyword;
	}

	static async updateKeyword(
		id: string,
		data: Partial<IBannedKeyword>,
	): Promise<IBannedKeyword | null> {
		const keyword = await BannedKeyword.findByIdAndUpdate(id, data, {
			new: true,
		});
		if (keyword) {
			await this.invalidateCache();
		}
		return keyword;
	}

	static async deleteKeyword(id: string): Promise<boolean> {
		const result = await BannedKeyword.findByIdAndUpdate(
			id,
			{ isActive: false },
			{ new: true },
		);
		if (result) {
			await this.invalidateCache();
			return true;
		}
		return false;
	}

	static async hardDeleteKeyword(id: string): Promise<boolean> {
		const result = await BannedKeyword.findByIdAndDelete(id);
		if (result) {
			await this.invalidateCache();
			return true;
		}
		return false;
	}

	static async getKeywordById(id: string): Promise<IBannedKeyword | null> {
		return BannedKeyword.findById(id).lean();
	}

	private static async invalidateCache(): Promise<void> {
		try {
			await redisClient.del(REDIS_KEY);
		} catch {
			console.error("Failed to invalidate banned keywords cache");
		}
	}
}

export default BannedKeywordService;
