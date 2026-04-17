"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { DeckForm } from "@/components/deck-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DeckListItem = {
  id: string;
  title: string;
  description: string | null;
  updatedAt: Date;
  cardCount: number;
  dueCount: number;
};

type DeckListProps = {
  decks: DeckListItem[];
};

export function DeckList({ decks }: DeckListProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateDeck(title: string, description: string) {
    setError(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      const payload = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !payload.id) {
        throw new Error(payload.error || "Failed to create deck.");
      }

      router.refresh();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Failed to create deck.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {decks.length} {decks.length === 1 ? "deck" : "decks"}
        </p>
        <DeckForm
          onSave={handleCreateDeck}
          isSaving={isCreating}
          error={error}
        />
      </div>

      {decks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No decks yet</CardTitle>
            <CardDescription>Create a deck to start studying.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {decks.map((deck) => (
        <Card key={deck.id}>
          <CardHeader>
            <CardTitle>{deck.title}</CardTitle>
            <CardDescription>
              {deck.description || "No description provided."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{deck.cardCount} cards</span>
            <span>{deck.dueCount} due</span>
          </CardContent>
          <CardFooter className="justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              Updated{" "}
              {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                new Date(deck.updatedAt),
              )}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/deck/${deck.id}`}>Open</Link>
              </Button>
              <Button asChild>
                <Link href={`/study/${deck.id}`}>Study</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
