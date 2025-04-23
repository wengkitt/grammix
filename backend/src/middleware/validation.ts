import { Context, Next } from "hono";
import { z } from "zod";

const textSchema = z.object({
  text: z
    .string()
    .min(1, "Text cannot be empty")
    .max(5000, "Text length exceeds maximum limit of 5000 characters")
    .regex(/^[\p{L}\p{N}\p{P}\p{Z}\s]+$/u, "Text contains invalid characters"),
});

export const validateRequest = async (c: Context, next: Next) => {
  try {
    const body = await c.req.json();
    const result = textSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        {
          error: "Validation failed",
          details: result.error.errors,
        },
        400
      );
    }

    // Store validated data in context for later use
    c.set("validatedText", result.data.text);
    await next();
  } catch (error) {
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }
    throw error;
  }
};
