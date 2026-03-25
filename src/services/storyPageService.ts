// src/services/storyPageService.ts
import type { IStory } from "../interfaces/story";
import { Story } from "../models/Story";
import { slugify } from "../utils/validation";

const escapeRegExp = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildUniqueStorySlug = async (title: string): Promise<string> => {
	const baseSlug = slugify(title || "") || `story-${Date.now()}`;
	const slugPattern = new RegExp(
		`^${escapeRegExp(baseSlug)}(?:-(\\d+))?$`,
		"i",
	);

	const existedSlugs = await Story.find({ slug: slugPattern })
		.select("slug -_id")
		.lean();

	if (existedSlugs.length === 0) {
		return baseSlug;
	}

	const normalizedSlugs = new Set(
		existedSlugs
			.map((item) => item.slug)
			.filter((item): item is string => typeof item === "string")
			.map((item) => item.toLowerCase()),
	);

	if (!normalizedSlugs.has(baseSlug.toLowerCase())) {
		return baseSlug;
	}

	let maxSuffix = 1;
	for (const existedSlug of normalizedSlugs) {
		const match = existedSlug.match(
			new RegExp(`^${escapeRegExp(baseSlug.toLowerCase())}-(\\d+)$`),
		);
		if (!match) continue;

		const suffix = Number(match[1]);
		if (!Number.isNaN(suffix)) {
			maxSuffix = Math.max(maxSuffix, suffix);
		}
	}

	return `${baseSlug}-${maxSuffix + 1}`;
};
export async function createStory(data: Partial<IStory>) {
	try {
		const slug = await buildUniqueStorySlug(data.title || "");
		const story = new Story({ ...data, slug });
		await story.save();
		return {
			...story.toObject(),
			id: story._id.toString(),
		};
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
