import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getOpenAIClient } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type GenerateCardsBody = {
  text?: string;
  deckId?: string;
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

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = (await request.json()) as GenerateCardsBody;
    const text = body.text?.trim();
    const deckId = body.deckId?.trim();

    if (!text) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    if (!deckId) {
      return NextResponse.json({ error: "Deck id is required." }, { status: 400 });
    }

    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }

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

    const createdCards = await prisma.$transaction(async (tx) => {
      const created = await Promise.all(
        cards.map((card) =>
          tx.card.create({
            data: {
              deckId: deck.id,
              front: card.front,
              back: card.back,
            },
          }),
        ),
      );

      await tx.deck.update({
        where: { id: deck.id },
        data: { updatedAt: new Date() },
      });

      return created;
    });

    return NextResponse.json(createdCards, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate flashcards.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
