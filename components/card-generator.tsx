"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CardEditor, type EditableCard } from "@/components/card-editor";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type DeckOption = {
  id: string;
  title: string;
};

type GeneratedCard = EditableCard;

type CardGeneratorProps = {
  decks?: DeckOption[];
};

const NEW_DECK_VALUE = "__new__";

export function CardGenerator({ decks: initialDecks }: CardGeneratorProps) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [decks, setDecks] = useState<DeckOption[]>(initialDecks ?? []);
  const [selectedDeckId, setSelectedDeckId] = useState(NEW_DECK_VALUE);
  const [error, setError] = useState<string | null>(null);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [isLoadingDecks, setIsLoadingDecks] = useState(!initialDecks);
  const [isGeneratePending, setIsGeneratePending] = useState(false);
  const [isCreateDeckPending, setIsCreateDeckPending] = useState(false);
  const [savingCardId, setSavingCardId] = useState<string | null>(null);

  useEffect(() => {
    if (initialDecks) {
      return;
    }

    let cancelled = false;

    async function loadDecks() {
      setIsLoadingDecks(true);
      setDeckError(null);

      try {
        const response = await fetch("/api/decks");
        const payload = (await response.json()) as
          | Array<{ id: string; title: string }>
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in payload ? payload.error || "Failed to load decks." : "Failed to load decks.",
          );
        }

        if (!cancelled) {
          setDecks(payload.map((deck) => ({ id: deck.id, title: deck.title })));
        }
      } catch (caughtError) {
        if (!cancelled) {
          setDeckError(
            caughtError instanceof Error ? caughtError.message : "Failed to load decks.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDecks(false);
        }
      }
    }

    void loadDecks();

    return () => {
      cancelled = true;
    };
  }, [initialDecks]);

  function handleGenerate() {
    setError(null);

    void (async () => {
      setIsGeneratePending(true);

      try {
        const response = await fetch("/api/generate-cards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: notes }),
        });

        const payload = (await response.json()) as
          | GeneratedCard[]
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in payload
              ? payload.error || "Failed to generate cards."
              : "Failed to generate cards.",
          );
        }

        setGeneratedCards(
          payload.map((card, index) => ({
            id: `${Date.now()}-${index}`,
            front: card.front,
            back: card.back,
          })),
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : "Failed to generate cards.",
        );
      } finally {
        setIsGeneratePending(false);
      }
    })();
  }

  function updateGeneratedCard(cardId: string, updates: Partial<GeneratedCard>) {
    setGeneratedCards((currentCards) =>
      currentCards.map((card) =>
        card.id === cardId ? { ...card, ...updates } : card,
      ),
    );
  }

  async function saveGeneratedCard(card: GeneratedCard) {
    if (selectedDeckId === NEW_DECK_VALUE) {
      throw new Error("Select an existing deck or create a new deck first.");
    }

    const response = await fetch("/api/cards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deckId: selectedDeckId,
        front: card.front,
        back: card.back,
      }),
    });

    if (response.status === 204) {
      return;
    }

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(payload.error || "Failed to save card.");
    }

    setGeneratedCards((currentCards) =>
      currentCards.filter((currentCard) => currentCard.id !== card.id),
    );
    router.refresh();
  }

  async function handleSaveCard(card: GeneratedCard) {
    setSavingCardId(card.id);
    setError(null);

    try {
      await saveGeneratedCard(card);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to save card.");
      throw caughtError;
    } finally {
      setSavingCardId(null);
    }
  }

  function handleDeleteCard(cardId: string) {
    setGeneratedCards((currentCards) =>
      currentCards.filter((card) => card.id !== cardId),
    );
  }

  async function handleCreateDeck(title: string, description: string) {
    setError(null);

    setIsCreateDeckPending(true);

    try {
      const cards = generatedCards
        .filter((card) => card.front.trim() && card.back.trim())
        .map(({ front, back }) => ({ front, back }));

      const response = await fetch("/api/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          cards,
        }),
      });

      const payload = (await response.json()) as {
        id?: string;
        title?: string;
        error?: string;
      };

      if (!response.ok || !payload.id || !payload.title) {
        throw new Error(payload.error || "Failed to create deck.");
      }

      setDecks((currentDecks) => [
        { id: payload.id, title: payload.title },
        ...currentDecks,
      ]);
      setSelectedDeckId(payload.id);
      setGeneratedCards([]);
      setNotes("");
      router.refresh();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Failed to create deck.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsCreateDeckPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Cards</CardTitle>
        <CardDescription>
          Paste study notes, choose where the cards should go, and edit results before saving.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="card-generator-notes">
            Notes
          </label>
          <Textarea
            id="card-generator-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Paste notes here..."
            className="min-h-40"
            disabled={isGeneratePending}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="card-generator-deck">
            Deck
          </label>
          <Select
            value={selectedDeckId}
            onValueChange={setSelectedDeckId}
            disabled={isLoadingDecks || isCreateDeckPending}
          >
            <SelectTrigger id="card-generator-deck" className="w-full">
              <SelectValue placeholder="Select a deck" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NEW_DECK_VALUE}>Create a new deck</SelectItem>
              {decks.map((deck) => (
                <SelectItem key={deck.id} value={deck.id}>
                  {deck.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLoadingDecks ? (
            <p className="text-sm text-muted-foreground">Loading decks...</p>
          ) : null}
          {deckError ? <p className="text-sm text-destructive">{deckError}</p> : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {generatedCards.length > 0 ? (
          <div className="space-y-3">
            {generatedCards.map((card) => (
              <CardEditor
                key={card.id}
                card={card}
                onChange={(updates) => updateGeneratedCard(card.id, updates)}
                onSave={() => handleSaveCard(card)}
                onDelete={() => {
                  handleDeleteCard(card.id);
                }}
                isSaving={savingCardId === card.id}
                disableSave={selectedDeckId === NEW_DECK_VALUE}
              />
            ))}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <DeckForm
          triggerLabel="Create Deck"
          title="Create Deck"
          description="Create a deck and save the generated cards into it."
          saveLabel="Save Deck"
          onSave={handleCreateDeck}
          isSaving={isCreateDeckPending}
          disabled={generatedCards.length === 0}
        />
        <Button
          onClick={handleGenerate}
          disabled={isGeneratePending || !notes.trim()}
        >
          {isGeneratePending ? "Generating..." : "Generate"}
        </Button>
      </CardFooter>
    </Card>
  );
}
