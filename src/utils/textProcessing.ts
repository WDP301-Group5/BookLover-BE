export function chunkText(text: string, maxTokens: number = 4000): string[] {
	const charsPerToken = 4;
	const maxChars = maxTokens * charsPerToken;

	if (text.length <= maxChars) {
		return [text];
	}

	const chunks: string[] = [];
	const paragraphs = text.split(/\n\n+/);

	let currentChunk = "";

	for (const paragraph of paragraphs) {
		if (currentChunk.length + paragraph.length > maxChars) {
			if (currentChunk.length > 0) {
				chunks.push(currentChunk.trim());
				currentChunk = "";
			}

			if (paragraph.length > maxChars) {
				const sentences = paragraph.split(/(?<=[.!?])\s+/);
				for (const sentence of sentences) {
					if (currentChunk.length + sentence.length > maxChars) {
						if (currentChunk.length > 0) {
							chunks.push(currentChunk.trim());
							currentChunk = "";
						}
						if (sentence.length > maxChars) {
							for (let i = 0; i < sentence.length; i += maxChars) {
								chunks.push(sentence.slice(i, i + maxChars));
							}
						} else {
							currentChunk = sentence;
						}
					} else {
						currentChunk += (currentChunk ? " " : "") + sentence;
					}
				}
			} else {
				currentChunk = paragraph;
			}
		} else {
			currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
		}
	}

	if (currentChunk.trim().length > 0) {
		chunks.push(currentChunk.trim());
	}

	return chunks;
}

export function aggregateScores(
	scores: Array<{
		toxicity: number;
		sexual: number;
		violence: number;
		political: number;
	}>,
): { toxicity: number; sexual: number; violence: number; political: number } {
	if (scores.length === 0) {
		return { toxicity: 0, sexual: 0, violence: 0, political: 0 };
	}

	const max = (arr: number[]) => Math.max(...arr);
	const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

	return {
		toxicity: max(scores.map((s) => s.toxicity)),
		sexual: max(scores.map((s) => s.sexual)),
		violence: max(scores.map((s) => s.violence)),
		political: max(scores.map((s) => s.political)),
	};
}
