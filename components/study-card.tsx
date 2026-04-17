"use client";

import { useMemo, useState, useTransition } from "react";
import { RotateCcwIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StudyCardItem = {
  id: string;
  front: string;
  back: string;
  repetitions: number;
  interval: number;
};

type StudyCardProps = {
  deckId: string;
  deckTitle: string;
  cards: StudyCardItem[];
};

export function StudyCard({ deckId, deckTitle, cards: initialCards }: StudyCardProps) {
  const [cards, setCards] = useState(initialCards);
  const [flipped, setFlipped] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentCard = cards[0];
  const progress = useMemo(() => {
    if (initialCards.length === 0) {
      return 100;
    }

    return Math.round((completedCount / initialCards.length) * 100);
  }, [completedCount, initialCards.length]);

  function handleReview(result: "again" | "good") {
    if (!currentCard) {
      return;
    }

    setError(null);

    startTransition(async () => {
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

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Failed to save study result.");
        }

        setCards((existing) => {
          const nextCards = [...existing];
          const [reviewed] = nextCards.splice(0, 1);

          if (result === "again" && reviewed) {
            nextCards.push({
              ...reviewed,
              interval: payload.interval,
              repetitions: payload.repetitions,
            });
          }

          return nextCards;
        });
        if (result === "good") {
          setCompletedCount((value) => value + 1);
        }
        setFlipped(false);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : "Failed to save study result.",
        );
      }
    });
  }

  if (!currentCard) {
    return (
      <Card className="border-0 bg-white/85 shadow-lg shadow-amber-950/8 ring-1 ring-amber-900/10">
        <CardHeader>
          <CardTitle>Session complete</CardTitle>
          <CardDescription>
            You reviewed every due card in {deckTitle}. Come back when the next batch is ready.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            Study route: <span className="font-medium">/study/{deckId}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{deckTitle}</span>
          <span>{cards.length} cards remaining</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-amber-100">
          <div
            className="h-full rounded-full bg-amber-800 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card className="border-0 bg-white/90 shadow-xl shadow-amber-950/10 ring-1 ring-amber-900/10">
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary" className="bg-amber-100 text-amber-900">
              Card {completedCount + 1}
            </Badge>
            <div className="text-sm text-muted-foreground">
              Interval {currentCard.interval}d • Reps {currentCard.repetitions}
            </div>
          </div>
          <CardTitle className="text-balance text-2xl leading-tight">
            {flipped ? currentCard.back : currentCard.front}
          </CardTitle>
          <CardDescription>
            {flipped ? "Answer side" : "Prompt side"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            onClick={() => setFlipped((value) => !value)}
            className="flex min-h-72 w-full flex-col justify-between rounded-2xl border border-amber-900/10 bg-gradient-to-br from-white to-amber-50 p-6 text-left transition hover:border-amber-900/20 hover:shadow-md"
          >
            <p className="text-lg leading-8 text-foreground">
              {flipped ? currentCard.back : currentCard.front}
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <RotateCcwIcon className="size-4" />
              <span>Click to flip</span>
            </div>
          </button>
          {error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-3 bg-gradient-to-r from-amber-50 to-orange-50">
          <Button variant="outline" onClick={() => setFlipped((value) => !value)}>
            {flipped ? "Show prompt" : "Show answer"}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="destructive" onClick={() => handleReview("again")} disabled={isPending}>
              Don&apos;t know
            </Button>
            <Button
              onClick={() => handleReview("good")}
              disabled={isPending}
              className="bg-amber-900 text-amber-50 hover:bg-amber-800"
            >
              Know
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
