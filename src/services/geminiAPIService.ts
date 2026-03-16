import { GoogleGenerativeAI } from "@google/generative-ai";
import { DOTENV } from "../consts/dotenv.js";
import {
  GEMINI_SYSTEM_PROMPT,
  GEMINI_USER_PROMPT,
} from "../consts/geminiPrompt.js";

export interface GeminiDecision {
  decision: "APPROVE" | "FLAG" | "REJECT";
  scores: {
    toxicity: number;
    sexual: number;
    violence: number;
    political: number;
  };
  reasons: string[];
  warnings: string[];
}

class GeminiAPIService {
  private static genAI: GoogleGenerativeAI | null = null;

  private static getClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      const apiKey = DOTENV.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured");
      }
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
    return this.genAI;
  }

  static async analyze(content: string): Promise<GeminiDecision> {
    if (!content || content.trim().length === 0) {
      return {
        decision: "FLAG",
        scores: {
          toxicity: 0.5,
          sexual: 0.5,
          violence: 0.5,
          political: 0.5,
        },
        reasons: ["Content is empty"],
        warnings: [],
      };
    }

    const client = this.getClient();
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: GEMINI_SYSTEM_PROMPT,
    });

    const prompt = GEMINI_USER_PROMPT(content);

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : text;

      try {
        const parsed = JSON.parse(jsonString);
        return {
          decision: parsed.decision || "FLAG",
          scores: {
            toxicity: parsed.scores?.toxicity ?? 0.5,
            sexual: parsed.scores?.sexual ?? 0.5,
            violence: parsed.scores?.violence ?? 0.5,
            political: parsed.scores?.political ?? 0.5,
          },
          reasons: parsed.reasons || [],
          warnings: parsed.warnings || [],
        };
      } catch {
        console.error("Failed to parse Gemini response:", text);
        return {
          decision: "FLAG",
          scores: {
            toxicity: 0.5,
            sexual: 0.5,
            violence: 0.5,
            political: 0.5,
          },
          reasons: ["Failed to parse AI response"],
          warnings: [],
        };
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error(`Gemini API analysis failed: ${error}`);
    }
  }
}

export default GeminiAPIService;
