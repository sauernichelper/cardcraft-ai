import type { Card } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type ReviewResult = "again" | "good";

const MIN_EASE_FACTOR = 1.3;

export function calculateNextReview(card: Card, result: ReviewResult) {
  const now = new Date();

  if (result === "again") {
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + 1);

    return {
      ...card,
      nextReview,
      interval: 1,
      repetitions: 0,
      easeFactor: Math.max(MIN_EASE_FACTOR, card.easeFactor - 0.2),
    };
  }

  const interval =
    card.repetitions === 0
      ? 1
      : Math.max(1, Math.round(card.interval * card.easeFactor));
  const repetitions = card.repetitions + 1;
  const easeFactor = card.easeFactor + 0.1;

  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...card,
    nextReview,
    interval,
    repetitions,
    easeFactor,
  };
}

export async function getCardsDueForReview(userId: string, deckId?: string) {
  return prisma.card.findMany({
    where: {
      nextReview: {
        lte: new Date(),
      },
      suspended: false,
      deck: {
        userId,
      },
      ...(deckId ? { deckId } : {}),
    },
    orderBy: [{ nextReview: "asc" }, { createdAt: "asc" }],
  });
}
