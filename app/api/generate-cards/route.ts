import { PDFParse } from "pdf-parse";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getOpenAIClient } from "@/lib/openai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type GenerateCardsBody = {
  text?: string;
};

type GeneratedCard = {
  front: string;
  back: string;
  type: string;
};

const CARD_TYPES = ["definition", "concept", "qa", "fact"] as const;

const flashcardSchema = {
  type: "array",
  minItems: 3,
  maxItems: 20,
  items: {
    type: "object",
    additionalProperties: false,
    required: ["front", "back", "type"],
    properties: {
      front: { type: "string" },
      back: { type: "string" },
      type: {
        type: "string",
        enum: [...CARD_TYPES],
      },
    },
  },
} as const;

class RequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function normalizeGeneratedCards(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((card): card is GeneratedCard => {
      if (!card || typeof card !== "object") {
        return false;
      }

      const candidate = card as Partial<GeneratedCard>;
      return (
        typeof candidate.front === "string" &&
        typeof candidate.back === "string" &&
        typeof candidate.type === "string"
      );
    })
    .map((card) => ({
      front: card.front.trim(),
      back: card.back.trim(),
      type: CARD_TYPES.includes(card.type as (typeof CARD_TYPES)[number])
        ? card.type
        : "concept",
    }))
    .filter((card) => card.front.length > 0 && card.back.length > 0);
}

function isPdfFile(file: File) {
  const fileName = file.name.toLowerCase();
  return file.type === "application/pdf" || fileName.endsWith(".pdf");
}

async function extractPdfText(file: File) {
  if (!isPdfFile(file)) {
    throw new RequestError("Only PDF files are supported for uploads.", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.byteLength === 0) {
    throw new RequestError("The selected PDF is empty.", 400);
  }

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const text = result.text.trim();

    if (!text) {
      throw new RequestError(
        "This PDF does not contain readable text. Try a different file.",
        400,
      );
    }

    return text;
  } catch (error) {
    if (error instanceof RequestError) {
      throw error;
    }

    throw new RequestError(
      "We couldn't read that PDF. Check the file and try again.",
      400,
    );
  } finally {
    await parser.destroy();
  }
}

async function getSourceText(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const textValue = formData.get("text");
    const fileValue = formData.get("file");
    const text = typeof textValue === "string" ? textValue.trim() : "";

    if (fileValue instanceof File && fileValue.size > 0) {
      return extractPdfText(fileValue);
    }

    if (text) {
      return text;
    }

    throw new RequestError("Add notes or upload a PDF to generate cards.", 400);
  }

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as GenerateCardsBody;
    const text = body.text?.trim();

    if (!text) {
      throw new RequestError("Text is required.", 400);
    }

    return text;
  }

  throw new RequestError(
    "Unsupported request format. Send JSON text or multipart form data.",
    415,
  );
}

export async function POST(request: Request) {
  try {
    await getCurrentUser();
    const text = await getSourceText(request);

    const response = await getOpenAIClient().responses.create({
      model: "gpt-5.2",
      instructions:
        "Generate exam-relevant flashcards from this text. Return JSON array: " +
        "[{ front: question, back: answer, type: definition | concept | qa | fact }]. " +
        "Make fronts concise and testable. Make backs accurate, direct, and study-ready. " +
        "Focus on key definitions, concepts, facts, and likely exam questions.",
      input: text,
      max_output_tokens: 1400,
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "flashcards",
          strict: true,
          schema: flashcardSchema,
        },
      },
    });

    const cards = normalizeGeneratedCards(JSON.parse(response.output_text));

    if (cards.length === 0) {
      throw new Error("The model did not return any usable flashcards.");
    }

    return NextResponse.json(cards, { status: 200 });
  } catch (error) {
    if (error instanceof RequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Failed to generate flashcards.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
