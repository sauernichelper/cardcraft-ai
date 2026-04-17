import Link from "next/link";
import { notFound } from "next/navigation";

import { StudyCard } from "@/components/study-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StudyPage(props: PageProps<"/study/[deckId]">) {
  const { deckId } = await props.params;
  const user = await getCurrentUser();
  const now = new Date();

  const deck = await prisma.deck.findFirst({
    where: {
      id: deckId,
      userId: user.id,
    },
    include: {
      cards: {
        where: {
          suspended: false,
          nextReview: {
            lte: now,
          },
        },
        orderBy: [{ nextReview: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!deck) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(120,53,15,0.12),_transparent_30%),linear-gradient(180deg,_#fff7ed_0%,_#fffdf8_45%,_#f4ece1_100%)] px-6 py-8 md:px-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-amber-900/70">
              Study mode
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-stone-950">
              {deck.title}
            </h1>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/deck/${deck.id}`}>Back to deck</Link>
          </Button>
        </div>

        {deck.cards.length === 0 ? (
          <Card className="border-0 bg-white/85 shadow-lg shadow-amber-950/8 ring-1 ring-amber-900/10">
            <CardHeader>
              <CardTitle>No cards due</CardTitle>
              <CardDescription>
                This deck has no active cards scheduled for review right now.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-amber-900 text-amber-50 hover:bg-amber-800">
                <Link href={`/deck/${deck.id}`}>Review deck details</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <StudyCard
            deckId={deck.id}
            deckTitle={deck.title}
            cards={deck.cards.map((card) => ({
              id: card.id,
              front: card.front,
              back: card.back,
              interval: card.interval,
              repetitions: card.repetitions,
            }))}
          />
        )}
      </div>
    </main>
  );
}
