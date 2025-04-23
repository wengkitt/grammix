import { Context, Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/correct", async (c: Context) => {
  try {
    const { text } = await c.req.json();
    const targetTone = "Neutral";

    if (!text || typeof text !== "string" || text.trim() === "") {
      return c.json(
        { error: 'Missing or invalid "text" field in request body' },
        400
      );
    }

    const modelName = c.env.GEMINI_MODEL;
    const apiKey = c.env.GEMINI_API_KEY;

    console.log(modelName);

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables.");
      return c.json(
        { error: "Server configuration error: API key missing" },
        500
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    // --- Improved Prompt ---
    const prompt = `Task: Correct the grammar and spelling of the provided text.
Language: Maintain the original language of the text.
Tone: Adjust the text to have a ${targetTone} tone.
Output Instructions: Respond with ONLY the corrected text. Do not include explanations, apologies, greetings, introductions, or alternative phrasings.

Text:
${text}`;
    // --- End of Improved Prompt ---

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error(
        `Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`,
        errorBody
      );
      let details = errorBody;
      try {
        details = JSON.parse(errorBody);
      } catch (e) {}
      return new Response(
        JSON.stringify({
          error: "Failed to call Gemini API",
          status: geminiResponse.status,
          details,
        }),
        {
          status: geminiResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await geminiResponse.json();

    let correctedText = null;
    try {
      correctedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!correctedText && data?.candidates?.[0]?.finishReason === "SAFETY") {
        console.warn(
          "Gemini response blocked due to safety settings:",
          JSON.stringify(data.candidates[0].safetyRatings)
        );
        return c.json({ error: "Content blocked by safety settings" }, 400);
      }
      if (!correctedText && data?.promptFeedback?.blockReason) {
        console.warn(
          "Gemini prompt blocked:",
          JSON.stringify(data.promptFeedback)
        );
        return c.json(
          { error: `Prompt blocked: ${data.promptFeedback.blockReason}` },
          400
        );
      }
    } catch (extractError) {
      console.error(
        "Error extracting text from Gemini response:",
        extractError,
        JSON.stringify(data)
      );
      return c.json(
        {
          error:
            "Failed to parse corrected text from Gemini response structure",
        },
        500
      );
    }

    if (typeof correctedText !== "string") {
      console.error(
        "Could not extract corrected text. Gemini Response:",
        JSON.stringify(data, null, 2)
      );
      return c.json(
        { error: "Failed to get corrected text from Gemini response data" },
        500
      );
    }

    c.header("Content-Type", "text/plain; charset=utf-8");
    return c.text(correctedText.trim());
  } catch (error: unknown) {
    console.error("Error in /correct endpoint:", error);
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return c.json(
      { error: "Internal Server Error", message: errorMessage },
      500
    );
  }
});

export default app;
