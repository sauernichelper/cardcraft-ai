"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StudyCardData = {
  id: string;
  front: string;
  back: string;
};

type StudyCardProps = {
  card: StudyCardData;
  onResult: (result: "again" | "good") => void | Promise<void>;
};

export function StudyCard({ card, onResult }: StudyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingResult, setPendingResult] = useState<"again" | "good" | null>(null);

  useEffect(() => {
    setIsFlipped(false);
    setError(null);
    setPendingResult(null);
  }, [card.id]);

  async function handleResult(result: "again" | "good") {
    setPendingResult(result);
    setError(null);

    try {
      await onResult(result);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to save study result.",
      );
    } finally {
      setPendingResult(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isFlipped ? "Back" : "Front"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="perspective-[1200px]">
          <div
            className={`relative min-h-64 w-full rounded-xl transition-transform duration-500 [transform-style:preserve-3d] ${
              isFlipped ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center rounded-xl border bg-background p-6 text-center text-lg [backface-visibility:hidden]">
              {card.front}
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-xl border bg-muted p-6 text-center text-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
              {card.back}
            </div>
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
      <CardFooter className="justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => setIsFlipped((current) => !current)}
          disabled={pendingResult !== null}
        >
          {isFlipped ? "Show Front" : "Flip"}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={() => {
              void handleResult("again");
            }}
            disabled={pendingResult !== null}
          >
            {pendingResult === "again" ? "Saving..." : "Don't Know"}
          </Button>
          <Button
            onClick={() => {
              void handleResult("good");
            }}
            disabled={pendingResult !== null}
          >
            {pendingResult === "good" ? "Saving..." : "Know"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
