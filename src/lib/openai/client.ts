import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (cachedClient) return cachedClient;
  cachedClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return cachedClient;
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL || "gpt-4.1-mini";
}
