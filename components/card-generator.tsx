"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type DeckOption = {
  id: string;
  title: string;
};

type GeneratedCard = EditableCard;

type CardGeneratorProps = {
  decks?: DeckOption[];
};

const NEW_DECK_VALUE = "__new__";
const INPUT_MODE_TEXT = "text";
const INPUT_MODE_PDF = "pdf";

type InputMode = typeof INPUT_MODE_TEXT | typeof INPUT_MODE_PDF;

function isObjectPayload(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === "object" && payload !== null;
}

function isDeckOptionsResponse(
  payload: unknown,
): payload is Array<{ id: string; title: string }> {
  return (
    Array.isArray(payload) &&
    payload.every(
      (deck) =>
        isObjectPayload(deck) &&
        typeof deck.id === "string" &&
        typeof deck.title === "string",
    )
  );
}

function isGeneratedCardsResponse(
  payload: unknown,
): payload is GeneratedCard[] {
  return (
    Array.isArray(payload) &&
    payload.every(
      (card) =>
        isObjectPayload(card) &&
        typeof card.front === "string" &&
        typeof card.back === "string",
    )
  );
}

function getErrorMessage(payload: unknown) {
  if (isObjectPayload(payload) && typeof payload.error === "string") {
    return payload.error;
  }

  return null;
}

function isCreatedDeckResponse(
  payload: unknown,
): payload is { id: string; title: string } {
  return (
    isObjectPayload(payload) &&
    typeof payload.id === "string" &&
    typeof payload.title === "string"
  );
}

export function CardGenerator({ decks: initialDecks }: CardGeneratorProps) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>(INPUT_MODE_TEXT);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
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
        const payload: unknown = await response.json();

        if (!response.ok) {
          throw new Error(getErrorMessage(payload) || "Failed to load decks.");
        }

        if (!isDeckOptionsResponse(payload)) {
          throw new Error("Failed to load decks.");
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

  function validatePdfFile(file: File) {
    const fileName = file.name.toLowerCase();

    if (file.type === "application/pdf" || fileName.endsWith(".pdf")) {
      return null;
    }

    return "Upload a PDF file to generate cards from a document.";
  }

  function handleFileSelection(file: File | null) {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validationError = validatePdfFile(file);

    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);
  }

  function handleGenerate() {
    setError(null);

    void (async () => {
      setIsGeneratePending(true);

      try {
        let response: Response;

        if (inputMode === INPUT_MODE_PDF) {
          if (!selectedFile) {
            throw new Error("Select a PDF before generating cards.");
          }

          const formData = new FormData();
          formData.append("file", selectedFile);

          response = await fetch("/api/generate-cards", {
            method: "POST",
            body: formData,
          });
        } else {
          response = await fetch("/api/generate-cards", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: notes }),
          });
        }

        const payload: unknown = await response.json();

        if (!response.ok) {
          throw new Error(getErrorMessage(payload) || "Failed to generate cards.");
        }

        if (!isGeneratedCardsResponse(payload)) {
          throw new Error("Failed to generate cards.");
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

    const payload: unknown = await response.json();

    if (!response.ok) {
      throw new Error(getErrorMessage(payload) || "Failed to save card.");
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

      const payload: unknown = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(payload) || "Failed to create deck.");
      }

      if (!isCreatedDeckResponse(payload)) {
        throw new Error("Failed to create deck.");
      }

      const createdDeck: DeckOption = {
        id: payload.id,
        title: payload.title,
      };

      setDecks((currentDecks) => [
        createdDeck,
        ...currentDecks,
      ]);
      setSelectedDeckId(createdDeck.id);
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

  const canGenerate = inputMode === INPUT_MODE_PDF
    ? Boolean(selectedFile)
    : Boolean(notes.trim());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Cards</CardTitle>
        <CardDescription>
          Paste study notes or upload a PDF, then edit the generated cards before saving.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          value={inputMode}
          onValueChange={(value) => {
            setInputMode(value as InputMode);
            setError(null);
          }}
          className="space-y-3"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={INPUT_MODE_TEXT}>Paste Text</TabsTrigger>
            <TabsTrigger value={INPUT_MODE_PDF}>Upload PDF</TabsTrigger>
          </TabsList>

          <TabsContent value={INPUT_MODE_TEXT} className="space-y-2">
            <label className="text-sm font-medium" htmlFor="card-generator-notes">
              Notes
            </label>
            <Textarea
              id="card-generator-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Paste lecture notes, study guides, or textbook excerpts here..."
              className="min-h-40"
              disabled={isGeneratePending}
            />
            <p className="text-sm text-muted-foreground">
              Best for quick note dumps and copied reading material.
            </p>
          </TabsContent>

          <TabsContent value={INPUT_MODE_PDF} className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">PDF</p>
              <label
                htmlFor="card-generator-file"
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragActive(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragActive(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    return;
                  }
                  setIsDragActive(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragActive(false);
                  handleFileSelection(event.dataTransfer.files[0] ?? null);
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-8 text-center transition-colors",
                  isDragActive
                    ? "border-foreground bg-muted/70"
                    : "border-border bg-muted/30 hover:border-foreground/40 hover:bg-muted/50",
                  isGeneratePending && "pointer-events-none opacity-60",
                )}
              >
                <div className="rounded-full bg-background p-3 shadow-sm">
                  {selectedFile ? (
                    <FileText className="size-5" aria-hidden="true" />
                  ) : (
                    <Upload className="size-5" aria-hidden="true" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-medium">
                    {selectedFile ? "Replace PDF" : "Drag and drop a PDF here"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Or click to browse for a study handout, article, or chapter.
                  </p>
                </div>
              </label>
              <Input
                id="card-generator-file"
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                disabled={isGeneratePending}
                onChange={(event) => {
                  handleFileSelection(event.target.files?.[0] ?? null);
                }}
              />
              {selectedFile ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 text-sm">
                  <span className="truncate font-medium">{selectedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto px-2 py-1 text-muted-foreground"
                    disabled={isGeneratePending}
                    onClick={() => {
                      setSelectedFile(null);
                      setError(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Only PDF files are supported. Scanned PDFs without selectable text may fail.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

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
          disabled={isGeneratePending || !canGenerate}
        >
          {isGeneratePending ? "Generating..." : "Generate"}
        </Button>
      </CardFooter>
    </Card>
  );
}
