import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { errorHandler } from "./middleware/error-handler";
import { validateRequest } from "./middleware/validation";
import { correctionService } from "./services/correction";

interface Env {
  GEMINI_MODEL: string;
  GEMINI_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use("*", prettyJSON());
app.use("*", cors());

// Routes
app.get("/", (c) => {
  return c.json({
    message: "Welcome to Grammix Grammar Correction API",
    version: "1.0.0",
    endpoints: {
      "/correct": "POST - Correct grammar and spelling of text",
    },
  });
});

app.post("/correct", validateRequest, async (c: Context) => {
  try {
    const { text } = await c.req.json();
    const result = await correctionService.correctText(text, c.env);
    return c.text(result);
  } catch (error) {
    return errorHandler(error, c);
  }
});

export default app;
