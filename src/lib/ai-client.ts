import OpenAI from "openai";

// Groq uses an OpenAI-compatible API
export const aiClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "",
  baseURL: "https://api.groq.com/openai/v1",
});

export const DEFAULT_MODEL = "llama-3.3-70b-versatile";
