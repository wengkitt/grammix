import { APIError } from "../middleware/error-handler";

interface Env {
  GEMINI_MODEL: string;
  GEMINI_API_KEY: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
    safetyRatings?: any[];
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
}

export const correctionService = {
  async correctText(text: string, env: Env): Promise<string> {
    const { GEMINI_MODEL, GEMINI_API_KEY } = env;

    if (!GEMINI_API_KEY) {
      throw new APIError("Server configuration error: API key missing", 500);
    }

    if (!GEMINI_MODEL) {
      throw new APIError("Server configuration error: Model missing", 500);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `Task: Correct the grammar and spelling of the provided text.
Language: Maintain the original language of the text.
Tone: Adjust the text to have a Neutral tone.
Output Instructions: Respond with ONLY the corrected text. Do not include explanations, apologies, greetings, introductions, or alternative phrasings.

Text:
${text}`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let details = errorBody;
        try {
          details = JSON.parse(errorBody);
        } catch (e) {}
        throw new APIError(
          "Failed to call Gemini API",
          response.status,
          details
        );
      }

      const data = (await response.json()) as GeminiResponse;
      const correctedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!correctedText && data?.candidates?.[0]?.finishReason === "SAFETY") {
        throw new APIError("Content blocked by safety settings", 400);
      }

      if (!correctedText && data?.promptFeedback?.blockReason) {
        throw new APIError(
          `Prompt blocked: ${data.promptFeedback.blockReason}`,
          400
        );
      }

      if (typeof correctedText !== "string") {
        throw new APIError(
          "Failed to get corrected text from Gemini response data",
          500
        );
      }

      return correctedText.trim();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        "Failed to process text correction",
        500,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  },
};
