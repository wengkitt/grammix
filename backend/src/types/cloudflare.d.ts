/// <reference types="@cloudflare/workers-types" />

declare global {
  interface Env {
    GEMINI_MODEL: string;
    GEMINI_API_KEY: string;
  }
}
