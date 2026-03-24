import type { IAIAnalysis } from "../interfaces/aiAnalysis.js";
import { AIAnalysis } from "../models/AIAnalysis.js";
import GeminiAPIService, {
  type GeminiDecision,
} from "../services/geminiAPIService.js";
import { chunkText } from "../utils/textProcessing.js";

export interface AnalysisResult {
  aiAnalysis: Partial<IAIAnalysis>;
  decision: "auto-approved" | "flagged" | "auto-rejected";
}

export interface StoryAnalysisResult {
  aiAnalysis: Partial<IAIAnalysis>;
  decision: "auto-approved" | "flagged" | "auto-rejected";
}

const AUTO_APPROVE_THRESHOLD = 0.6; // >= 60% safe = auto-approve
const AUTO_REJECT_THRESHOLD = 0.3; // < 30% safe = auto-reject
const STORY_AUTO_APPROVE_THRESHOLD = 0.7; // >= 70% safe = auto-approve for story metadata
const STORY_AUTO_REJECT_THRESHOLD = 0.4; // >= 40% risk = auto-reject for story metadata

class AIAnalysisService {
  static calculateOverallScore(gemini: GeminiDecision): number {
    const dangerScore = Math.max(
      gemini.scores.toxicity ?? 0,
      gemini.scores.sexual ?? 0,
      gemini.scores.violence ?? 0,
      gemini.scores.political ?? 0,
    );
    return 1 - dangerScore; // Convert to safety score (1 = safe, 0 = dangerous)
  }

  static calculateStoryOverallScore(gemini: GeminiDecision): number {
    const riskScore = Math.max(
      gemini.scores.inappropriateName ?? 0,
      gemini.scores.inappropriateDescription ?? 0,
      gemini.scores.inappropriateGenre ?? 0,
    );
    return 1 - riskScore; // Convert to safety score (1 = safe, 0 = dangerous)
  }

  static determineStoryDecision(
    safetyScore: number,
  ): StoryAnalysisResult["decision"] {
    if (safetyScore >= STORY_AUTO_APPROVE_THRESHOLD) {
      return "auto-approved";
    }
    if (safetyScore < STORY_AUTO_REJECT_THRESHOLD) {
      return "auto-rejected";
    }
    return "flagged";
  }

  static determineDecision(safetyScore: number): AnalysisResult["decision"] {
    if (safetyScore >= AUTO_APPROVE_THRESHOLD) {
      return "auto-approved";
    }
    if (safetyScore < AUTO_REJECT_THRESHOLD) {
      return "auto-rejected";
    }
    return "flagged";
  }

  static async analyze(
    chapterId: string,
    content: string,
  ): Promise<AnalysisResult> {
    let geminiDecision: GeminiDecision | undefined;

    try {
      const chunks = chunkText(content, 4000);
      const chunkResults: GeminiDecision[] = [];

      for (const chunk of chunks.slice(0, 3)) {
        const result = await GeminiAPIService.analyze(chunk);
        chunkResults.push(result);
      }

      if (chunkResults.length > 0) {
        const aggregatedScores = chunkResults.map((r) => r.scores);
        const avgScores = {
          toxicity:
            aggregatedScores.reduce((a, b) => a + (b.toxicity ?? 0), 0) /
            aggregatedScores.length,
          sexual:
            aggregatedScores.reduce((a, b) => a + (b.sexual ?? 0), 0) /
            aggregatedScores.length,
          violence:
            aggregatedScores.reduce((a, b) => a + (b.violence ?? 0), 0) /
            aggregatedScores.length,
          political:
            aggregatedScores.reduce((a, b) => a + (b.political ?? 0), 0) /
            aggregatedScores.length,
        };

        const allDecisions = chunkResults.map((r) => r.decision);
        const mostSevereDecision = allDecisions.includes("REJECT")
          ? "REJECT"
          : allDecisions.includes("FLAG")
            ? "FLAG"
            : "APPROVE";

        geminiDecision = {
          decision: mostSevereDecision as "APPROVE" | "FLAG" | "REJECT",
          scores: avgScores,
          reasons: [...new Set(chunkResults.flatMap((r) => r.reasons))],
          warnings: [...new Set(chunkResults.flatMap((r) => r.warnings || []))],
        };
      }
    } catch (error) {
      console.error("Gemini API failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      geminiDecision = {
        decision: "FLAG",
        scores: {
          toxicity: 0.5,
          sexual: 0.5,
          violence: 0.5,
          political: 0.5,
        },
        reasons: [`AI analysis failed: ${errorMessage}`],
        warnings: [],
      };
    }

    const geminiForScore = geminiDecision ?? {
      decision: "FLAG",
      scores: {
        toxicity: 0.5,
        sexual: 0.5,
        violence: 0.5,
        political: 0.5,
      },
      reasons: [],
      warnings: [],
    };
    const overallScore = this.calculateOverallScore(geminiForScore);
    const decision = this.determineDecision(overallScore);

    const aiAnalysis = await AIAnalysis.create({
      chapterId,
      perspectiveScores: undefined,
      geminiDecision,
      finalDecision: decision,
      reasons: geminiDecision?.reasons || [],
      processedAt: new Date(),
    });

    return {
      aiAnalysis,
      decision,
    };
  }

  static async getAnalysisByChapterId(
    chapterId: string,
  ): Promise<IAIAnalysis | null> {
    return AIAnalysis.findOne({ chapterId }).sort({ createdAt: -1 }).lean();
  }

  static async analyzeStoryMetadata(
    storyId: string,
    title: string,
    description: string,
    genres: string,
  ): Promise<StoryAnalysisResult> {
    let geminiDecision: GeminiDecision | undefined;

    try {
      const result = await GeminiAPIService.analyzeStoryMetadata(
        title,
        description,
        genres,
      );
      geminiDecision = result;
    } catch (error) {
      console.error("Gemini API story analysis failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      geminiDecision = {
        decision: "FLAG",
        scores: {
          inappropriateName: 0.5,
          inappropriateDescription: 0.5,
          inappropriateGenre: 0.5,
          overallRisk: 0.5,
        },
        reasons: [`AI story analysis failed: ${errorMessage}`],
        warnings: [],
      };
    }

    const geminiForScore = geminiDecision ?? {
      decision: "FLAG",
      scores: {
        inappropriateName: 0.5,
        inappropriateDescription: 0.5,
        inappropriateGenre: 0.5,
        overallRisk: 0.5,
      },
      reasons: [],
      warnings: [],
    };
    const overallScore = this.calculateStoryOverallScore(geminiForScore);
    const decision = this.determineStoryDecision(overallScore);

    const aiAnalysis = await AIAnalysis.create({
      storyId,
      chapterId: undefined,
      perspectiveScores: undefined,
      geminiDecision,
      finalDecision: decision,
      reasons: geminiDecision?.reasons || [],
      processedAt: new Date(),
    });

    return {
      aiAnalysis,
      decision,
    };
  }

  static async getAnalysisByStoryId(
    storyId: string,
  ): Promise<IAIAnalysis | null> {
    return AIAnalysis.findOne({ storyId }).sort({ createdAt: -1 }).lean();
  }
}

export default AIAnalysisService;
