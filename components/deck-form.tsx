"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";

type DeckFormProps = {
  triggerLabel?: string;
  title?: string;
  description?: string;
  saveLabel?: string;
  cancelLabel?: string;
  onSave: (title: string, description: string) => void | Promise<void>;
  isSaving?: boolean;
  error?: string | null;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DeckForm({
  triggerLabel = "Create Deck",
  title = "Create Deck",
  description = "Add a title and an optional description for the new deck.",
  saveLabel = "Save",
  cancelLabel = "Cancel",
  onSave,
  isSaving = false,
  error,
  disabled = false,
  open,
  onOpenChange,
}: DeckFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  function resetForm() {
    setDeckTitle("");
    setDeckDescription("");
    setLocalError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }

    setIsOpen(nextOpen);
  }

  async function handleSave() {
    setLocalError(null);

    try {
      await onSave(deckTitle.trim(), deckDescription.trim());
      resetForm();
      setIsOpen(false);
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error ? caughtError.message : "Failed to save deck.",
      );
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="deck-form-title">
              Title
            </label>
            <Input
              id="deck-form-title"
              value={deckTitle}
              onChange={(event) => setDeckTitle(event.target.value)}
              placeholder="Biology Review"
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              htmlFor="deck-form-description"
            >
              Description
            </label>
            <Textarea
              id="deck-form-description"
              value={deckDescription}
              onChange={(event) => setDeckDescription(event.target.value)}
              placeholder="Optional description"
              disabled={isSaving}
            />
          </div>
          {error || localError ? (
            <p className="text-sm text-destructive">{error || localError}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={() => {
              void handleSave();
            }}
            disabled={isSaving || !deckTitle.trim()}
          >
            {isSaving ? "Saving..." : saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
