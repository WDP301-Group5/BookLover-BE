import type { IBannedKeyword } from "../interfaces/bannedKeyword.js";

export interface HardFilterResult {
	blocked: boolean;
	matchedKeywords: {
		text: string;
		category: string;
		severity: string;
	}[];
}

class HardFilterService {
	private static compileRegex(pattern: string): RegExp | null {
		try {
			return new RegExp(pattern, "gi");
		} catch {
			return null;
		}
	}

	static checkContent(
		content: string,
		keywords: IBannedKeyword[],
	): HardFilterResult {
		const matchedKeywords: HardFilterResult["matchedKeywords"] = [];
		const lowerContent = content.toLowerCase();

		for (const keyword of keywords) {
			if (!keyword.isActive) continue;

			let isMatch = false;

			if (keyword.isRegex) {
				const regex = this.compileRegex(keyword.text);
				if (regex) {
					const matches = lowerContent.match(regex);
					if (matches && matches.length > 0) {
						isMatch = true;
					}
				}
			} else {
				const lowerKeyword = keyword.text.toLowerCase();
				if (lowerContent.includes(lowerKeyword)) {
					isMatch = true;
				}
			}

			if (isMatch) {
				matchedKeywords.push({
					text: keyword.text,
					category: keyword.category,
					severity: keyword.severity,
				});
			}
		}

		const hasCriticalMatch = matchedKeywords.some(
			(k) => k.severity === "critical",
		);

		return {
			blocked: hasCriticalMatch,
			matchedKeywords,
		};
	}

	static getMediumSeverityMatches(
		content: string,
		keywords: IBannedKeyword[],
	): HardFilterResult["matchedKeywords"] {
		const result = this.checkContent(content, keywords);
		return result.matchedKeywords.filter((k) => k.severity === "medium");
	}
}

export default HardFilterService;
