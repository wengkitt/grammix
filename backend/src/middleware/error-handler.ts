import { Context } from "hono";

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: any,
    public requestId?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 429, details);
    this.name = "RateLimitError";
  }
}

export class ServiceError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 500, details);
    this.name = "ServiceError";
  }
}

export const errorHandler = (error: unknown, c: Context) => {
  const requestId = c.req.header("x-request-id") || crypto.randomUUID();
  console.error("API Error:", {
    error,
    requestId,
    path: c.req.path,
    method: c.req.method,
  });

  if (error instanceof APIError) {
    return c.json(
      {
        error: error.message,
        details: error.details,
        requestId,
      },
      error.statusCode as 400 | 401 | 403 | 404 | 429 | 500
    );
  }

  if (error instanceof SyntaxError && error.message.includes("JSON")) {
    return c.json(
      {
        error: "Invalid JSON in request body",
        requestId,
      },
      400
    );
  }

  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  return c.json(
    {
      error: "Internal Server Error",
      message: errorMessage,
      requestId,
    },
    500
  );
};
