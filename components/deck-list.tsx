import Link from "next/link";
import { BookOpenIcon, Clock3Icon, Layers3Icon } from "lucide-react";

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
  if (decks.length === 0) {
    return (
      <Card className="border border-dashed border-amber-900/20 bg-white/70">
        <CardHeader>
          <CardTitle>No decks yet</CardTitle>
          <CardDescription>
            Generate a set of flashcards from notes or create a deck through the API.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {decks.map((deck) => (
        <Card key={deck.id} className="border-0 bg-white/85 shadow-lg shadow-amber-950/8 ring-1 ring-amber-900/10">
          <CardHeader className="gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{deck.title}</CardTitle>
                <CardDescription className="mt-1">
                  {deck.description || "No description yet."}
                </CardDescription>
              </div>
              <Badge variant={deck.dueCount > 0 ? "default" : "secondary"}>
                {deck.dueCount} due
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Layers3Icon className="size-4" />
              <span>{deck.cardCount} cards</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock3Icon className="size-4" />
              <span>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(deck.updatedAt)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between gap-3 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpenIcon className="size-4" />
              <span>Review or inspect deck details.</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href={`/deck/${deck.id}`}>Open deck</Link>
              </Button>
              <Button asChild className="bg-amber-900 text-amber-50 hover:bg-amber-800">
                <Link href={`/study/${deck.id}`}>Study</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
