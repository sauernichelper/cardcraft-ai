import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export { openai };

export function assertOpenAIKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
}
