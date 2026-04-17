import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  assertOpenAIKey();

  client ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return client;
}

export function assertOpenAIKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
}
