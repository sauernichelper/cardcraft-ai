"use client";

import { useState } from "react";

import { StudyCard } from "@/components/study-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StudySessionCard = {
  id: string;
  front: string;
  back: string;
};

type StudySessionProps = {
  deckId: string;
  deckTitle: string;
  cards: StudySessionCard[];
};

export function StudySession({
  deckId,
  deckTitle,
  cards: initialCards,
}: StudySessionProps) {
  const [cards, setCards] = useState(initialCards);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const currentCard = cards[0];

  async function handleResult(result: "again" | "good") {
    if (!currentCard) {
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/cards", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: currentCard.id,
          result,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to save study result.");
      }

      setCards((currentCards) => {
        const nextCards = [...currentCards];
        const [reviewedCard] = nextCards.splice(0, 1);

        if (reviewedCard && result === "again") {
          nextCards.push(reviewedCard);
        }

        return nextCards;
      });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to save study result.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsPending(false);
    }
  }

  if (!currentCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session complete</CardTitle>
          <CardDescription>
            You reviewed every due card in {deckTitle}.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Study route: /study/{deckId}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {cards.length} {cards.length === 1 ? "card" : "cards"} remaining
        {isPending ? " • Saving..." : ""}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <StudyCard card={currentCard} onResult={handleResult} />
    </div>
  );
}
