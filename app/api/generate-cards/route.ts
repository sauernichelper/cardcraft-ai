import { NextResponse } from "next/server";

import { assertOpenAIKey, openai } from "@/lib/openai";

type GeneratedCard = {
  front: string;
  back: string;
  type: string;
};

function extractJsonArray(content: string) {
  const trimmed = content.trim();

  if (trimmed.startsWith("[")) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");

  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim();

    if (!text) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    assertOpenAIKey();

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You convert study notes into concise flashcards. Return only valid JSON. " +
        "The response must be a JSON array of 6 to 12 objects shaped exactly like " +
        '{ "front": string, "back": string, "type": "definition" | "concept" | "qa" | "fact" }. ' +
        "Fronts should be short prompts. Backs should be accurate, direct study answers.",
      input: text,
    });

    const parsed = JSON.parse(extractJsonArray(response.output_text)) as GeneratedCard[];
    const cards = parsed
      .filter((card) => card.front?.trim() && card.back?.trim())
      .map((card) => ({
        front: card.front.trim(),
        back: card.back.trim(),
        type: card.type?.trim() || "concept",
      }));

    return NextResponse.json(cards);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate flashcards.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
