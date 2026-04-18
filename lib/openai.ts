type GeneratedCard = {
  front: string;
  back: string;
  type: string;
};

type OllamaGenerateResponse = {
  response?: string;
  error?: string;
};

type AIClient = {
  generateCards(text: string): Promise<GeneratedCard[]>;
};

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "llama3.2";

let client: AIClient | null = null;

function getOllamaUrl() {
  return (process.env.OLLAMA_URL ?? DEFAULT_OLLAMA_URL).replace(/\/$/, "");
}

function getOllamaModel() {
  return process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
}

function buildPrompt(text: string) {
  return [
    "Generate exam-relevant flashcards from the study text below.",
    "Return only valid JSON.",
    'Format: [{"front":"question","back":"answer","type":"definition|concept|qa|fact"}]',
    "Generate between 3 and 20 flashcards.",
    "Make fronts concise and testable.",
    "Make backs accurate, direct, and study-ready.",
    "Focus on key definitions, concepts, facts, and likely exam questions.",
    "",
    "Study text:",
    text,
  ].join("\n");
}

function extractJsonArray(content: string) {
  const trimmed = content.trim();

  if (trimmed.startsWith("[")) {
    return trimmed;
  }

  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Ollama did not return a JSON array.");
  }

  return trimmed.slice(start, end + 1);
}

async function generateCards(text: string) {
  const response = await fetch(`${getOllamaUrl()}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getOllamaModel(),
      prompt: buildPrompt(text),
      stream: false,
    }),
  });

  const payload = (await response.json()) as OllamaGenerateResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? "Ollama request failed.");
  }

  if (typeof payload.response !== "string" || payload.response.trim().length === 0) {
    throw new Error("Ollama returned an empty response.");
  }

  return JSON.parse(extractJsonArray(payload.response)) as GeneratedCard[];
}

export function getAIClient() {
  client ??= {
    generateCards,
  };

  return client;
}
