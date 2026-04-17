import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  client ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return client;
}

const openai = getOpenAIClient();

export { openai };

export function assertOpenAIKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
}
