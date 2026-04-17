import type { Card } from "@prisma/client";

export type ReviewResult = "again" | "good";

const MIN_EASE_FACTOR = 1.3;

export function calculateNextReview(result: ReviewResult, card: Card) {
  const now = new Date();

  if (result === "again") {
    return {
      ...card,
      nextReview: now,
      interval: 1,
      repetitions: 0,
      easeFactor: Math.max(MIN_EASE_FACTOR, card.easeFactor - 0.2),
    };
  }

  const repetitions = card.repetitions + 1;
  const easeFactor = Math.max(MIN_EASE_FACTOR, card.easeFactor + 0.1);

  let interval = 1;

  if (repetitions === 1) {
    interval = 1;
  } else if (repetitions === 2) {
    interval = 3;
  } else {
    interval = Math.max(1, Math.round(card.interval * easeFactor));
  }

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
