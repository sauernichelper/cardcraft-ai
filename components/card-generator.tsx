"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SparklesIcon, WandSparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type GeneratedCard = {
  front: string;
  back: string;
  type: string;
};

export function CardGenerator() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();

  function handleGenerate() {
    setError(null);

    startGenerating(async () => {
      try {
        const response = await fetch("/api/generate-cards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Failed to generate flashcards.");
        }

        setCards(payload);
        setDeckTitle((current) => current || "New CardCraft deck");
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to generate flashcards.",
        );
      }
    });
  }

  function handleSaveDeck() {
    setError(null);

    startSaving(async () => {
      try {
        const response = await fetch("/api/decks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: deckTitle,
            description: deckDescription,
            cards,
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Failed to save deck.");
        }

        setOpen(false);
        setText("");
        setCards([]);
        setDeckDescription("");
        setDeckTitle("");
        router.push(`/deck/${payload.id}`);
        router.refresh();
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : "Failed to save deck.",
        );
      }
    });
  }

  return (
    <Card className="border-0 bg-white/85 shadow-lg shadow-amber-950/8 ring-1 ring-amber-900/10 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl">Generate cards from notes</CardTitle>
            <CardDescription>
              Paste a lecture summary, article excerpt, or study guide and turn it into a deck.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-900">
            AI-assisted
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste study notes here. Include key concepts, definitions, dates, formulas, or processes."
          className="min-h-48 resize-y border-amber-900/10 bg-white"
        />
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        {cards.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {cards.map((card, index) => (
              <Card
                key={`${card.front}-${index}`}
                size="sm"
                className="border border-amber-900/10 bg-amber-50/70"
              >
                <CardHeader className="gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{card.front}</CardTitle>
                    <Badge variant="outline">{card.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{card.back}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SparklesIcon className="size-4 text-amber-700" />
          <span>{cards.length > 0 ? `${cards.length} cards ready to save.` : "No cards generated yet."}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            className="bg-amber-900 text-amber-50 hover:bg-amber-800"
          >
            <WandSparklesIcon className="size-4" />
            {isGenerating ? "Generating..." : "Generate cards"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={cards.length === 0}>
                Save as deck
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save generated deck</DialogTitle>
                <DialogDescription>
                  Give the deck a clear title so it is easy to revisit later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  value={deckTitle}
                  onChange={(event) => setDeckTitle(event.target.value)}
                  placeholder="Biology midterm review"
                />
                <Textarea
                  value={deckDescription}
                  onChange={(event) => setDeckDescription(event.target.value)}
                  placeholder="Optional description"
                  className="min-h-24"
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSaveDeck}
                  disabled={isSaving || !deckTitle.trim()}
                  className="bg-amber-900 text-amber-50 hover:bg-amber-800"
                >
                  {isSaving ? "Saving..." : "Create deck"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}
