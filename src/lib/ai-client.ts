import OpenAI from "openai";

export const aiClient = new OpenAI({
  apiKey: process.env.FEATHERLESS_API_KEY || "placeholder",
  baseURL: process.env.FEATHERLESS_BASE_URL || "https://api.featherless.ai/v1",
});

export const DEFAULT_MODEL = process.env.FEATHERLESS_MODEL || "google/gemma-4-31B-it";
