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
import { Textarea } from "@/components/ui/textarea";

export type EditableCard = {
  id: string;
  front: string;
  back: string;
};

type CardEditorProps = {
  card: EditableCard;
  onSave?: (card: EditableCard) => void | Promise<void>;
  onDelete?: (card: EditableCard) => void | Promise<void>;
  onChange?: (updates: Partial<EditableCard>) => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  disableSave?: boolean;
};

export function CardEditor({
  card,
  onSave,
  onDelete,
  onChange,
  isSaving = false,
  isDeleting = false,
  disableSave = false,
}: CardEditorProps) {
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFront(card.front);
    setBack(card.back);
  }, [card.back, card.front, card.id]);

  function updateFront(value: string) {
    setFront(value);
    onChange?.({ front: value });
  }

  function updateBack(value: string) {
    setBack(value);
    onChange?.({ back: value });
  }

  async function handleSave() {
    if (!onSave) {
      return;
    }

    setError(null);

    try {
      await onSave({
        ...card,
        front,
        back,
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to save card.");
    }
  }

  async function handleDelete() {
    if (!onDelete) {
      return;
    }

    setError(null);

    try {
      await onDelete({
        ...card,
        front,
        back,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Failed to delete card.",
      );
    }
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Card</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={`front-${card.id}`}>
            Front
          </label>
          <Textarea
            id={`front-${card.id}`}
            value={front}
            onChange={(event) => updateFront(event.target.value)}
            disabled={isSaving || isDeleting}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={`back-${card.id}`}>
            Back
          </label>
          <Textarea
            id={`back-${card.id}`}
            value={back}
            onChange={(event) => updateBack(event.target.value)}
            disabled={isSaving || isDeleting}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            void handleSave();
          }}
          disabled={
            disableSave || isSaving || isDeleting || !front.trim() || !back.trim()
          }
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            void handleDelete();
          }}
          disabled={isSaving || isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </CardFooter>
    </Card>
  );
}
