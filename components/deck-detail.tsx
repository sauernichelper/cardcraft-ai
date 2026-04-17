"use client";

import { useState } from "react";
import Link from "next/link";

import { CardEditor, type EditableCard } from "@/components/card-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DeckDetailCard = EditableCard & {
  nextReview: string;
  suspended: boolean;
};

type DeckDetailProps = {
  deck: {
    id: string;
    title: string;
    description: string | null;
    updatedAt: string;
  };
  initialCards: DeckDetailCard[];
};

export function DeckDetail({ deck, initialCards }: DeckDetailProps) {
  const [cards, setCards] = useState(initialCards);
  const [savingCardId, setSavingCardId] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [referenceTime] = useState(() => Date.now());

  const dueCount = cards.filter(
    (card) =>
      !card.suspended && new Date(card.nextReview).getTime() <= referenceTime,
  ).length;

  async function handleSave(card: EditableCard) {
    setSavingCardId(card.id);
    setPageError(null);

    try {
      const response = await fetch("/api/cards", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: card.id,
          front: card.front,
          back: card.back,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        front?: string;
        back?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to save card.");
      }

      setCards((currentCards) =>
        currentCards.map((currentCard) =>
          currentCard.id === card.id
            ? {
                ...currentCard,
                front: payload.front ?? card.front,
                back: payload.back ?? card.back,
              }
            : currentCard,
        ),
      );
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Failed to save card.";
      setPageError(message);
      throw new Error(message);
    } finally {
      setSavingCardId(null);
    }
  }

  async function handleDelete(card: EditableCard) {
    setDeletingCardId(card.id);
    setPageError(null);

    try {
      const response = await fetch(`/api/cards?id=${encodeURIComponent(card.id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Failed to delete card.");
      }

      setCards((currentCards) =>
        currentCards.filter((currentCard) => currentCard.id !== card.id),
      );
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Failed to delete card.";
      setPageError(message);
      throw new Error(message);
    } finally {
      setDeletingCardId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#fffaf2_0%,_#fffdf8_45%,_#f6efe4_100%)] px-6 py-8 md:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Card className="border-0 bg-stone-950 text-stone-50 shadow-2xl shadow-stone-950/10">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <Badge className="w-fit bg-amber-300 text-stone-950 hover:bg-amber-300">
                  Deck detail
                </Badge>
                <CardTitle className="text-4xl">{deck.title}</CardTitle>
                <CardDescription className="max-w-2xl text-stone-300">
                  {deck.description || "No description yet."}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  asChild
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/">Back home</Link>
                </Button>
                <Button
                  asChild
                  className="bg-amber-300 text-stone-950 hover:bg-amber-200"
                >
                  <Link href={`/study/${deck.id}`}>Start study session</Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-2xl font-semibold">{cards.length}</p>
              <p className="text-sm text-stone-300">Total cards</p>
            </div>
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-2xl font-semibold">{dueCount}</p>
              <p className="text-sm text-stone-300">Due now</p>
            </div>
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-2xl font-semibold">
                {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                  new Date(deck.updatedAt),
                )}
              </p>
              <p className="text-sm text-stone-300">Last updated</p>
            </div>
          </CardContent>
        </Card>

        {pageError ? <p className="text-sm text-destructive">{pageError}</p> : null}

        {cards.length === 0 ? (
          <Card className="border-0 bg-white/85 shadow-lg shadow-amber-950/8 ring-1 ring-amber-900/10">
            <CardHeader>
              <CardTitle>No cards in this deck</CardTitle>
              <CardDescription>
                Generate or add cards from the home page, then come back here to edit them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-amber-900 text-amber-50 hover:bg-amber-800">
                <Link href="/">Create cards</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <section className="grid gap-4">
            {cards.map((card, index) => (
              <div key={card.id} className="space-y-3">
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-stone-950">
                      Card {index + 1}
                    </h2>
                    <Badge variant={card.suspended ? "destructive" : "secondary"}>
                      {card.suspended ? "Suspended" : "Active"}
                    </Badge>
                  </div>
                  <Badge variant="outline">
                    Review{" "}
                    {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                      new Date(card.nextReview),
                    )}
                  </Badge>
                </div>
                <CardEditor
                  card={{
                    id: card.id,
                    front: card.front,
                    back: card.back,
                  }}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  isSaving={savingCardId === card.id}
                  isDeleting={deletingCardId === card.id}
                />
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
