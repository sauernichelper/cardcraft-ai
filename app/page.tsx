import { BrainCircuitIcon, Clock3Icon, LibraryBigIcon } from "lucide-react";

import { CardGenerator } from "@/components/card-generator";
import { DeckList } from "@/components/deck-list";
import { Badge } from "@/components/ui/badge";
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

export default async function Home() {
  const user = await getCurrentUser();
  const now = new Date();
  const decks = await prisma.deck.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { cards: true },
      },
      cards: {
        where: {
          suspended: false,
          nextReview: { lte: now },
        },
        select: { id: true },
      },
    },
  });

  const totalCards = decks.reduce((sum, deck) => sum + deck._count.cards, 0);
  const totalDue = decks.reduce((sum, deck) => sum + deck.cards.length, 0);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_38%),linear-gradient(180deg,_#fffaf2_0%,_#fffdf8_45%,_#f6efe4_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 md:px-10 lg:px-12">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-0 bg-stone-950 text-stone-50 shadow-2xl shadow-stone-950/15">
            <CardHeader className="gap-4">
              <Badge className="w-fit bg-amber-300 text-stone-950 hover:bg-amber-300">
                CardCraft AI
              </Badge>
              <CardTitle className="max-w-2xl text-4xl leading-tight md:text-5xl">
                Turn raw notes into durable memory.
              </CardTitle>
              <CardDescription className="max-w-2xl text-base text-stone-300 md:text-lg">
                Generate flashcards from source text, organize them into decks, and review with a built-in spaced repetition schedule.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-white/8 p-4">
                <BrainCircuitIcon className="mb-4 size-5 text-amber-300" />
                <p className="text-2xl font-semibold">{decks.length}</p>
                <p className="text-sm text-stone-300">Decks in your workspace</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-4">
                <LibraryBigIcon className="mb-4 size-5 text-amber-300" />
                <p className="text-2xl font-semibold">{totalCards}</p>
                <p className="text-sm text-stone-300">Cards stored</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-4">
                <Clock3Icon className="mb-4 size-5 text-amber-300" />
                <p className="text-2xl font-semibold">{totalDue}</p>
                <p className="text-sm text-stone-300">Cards due now</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 shadow-lg shadow-amber-950/8 ring-1 ring-amber-900/10 backdrop-blur">
            <CardHeader>
              <CardTitle>Active learner</CardTitle>
              <CardDescription>
                This workspace uses {user.email === "demo@cardcraft.local" ? "a demo learner profile" : user.email}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Credentials auth is configured at <code>/api/auth/[...nextauth]</code>. When no session exists, the app falls back to a local demo learner so deck creation and study flows work immediately.
              </p>
              <div className="rounded-2xl bg-amber-50 p-4 text-amber-950">
                <p className="font-medium">{user.name || "Demo Learner"}</p>
                <p>{user.email}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <CardGenerator />
          <section className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-amber-900/70">
                Your library
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-stone-950">
                Study decks
              </h2>
            </div>
            <DeckList
              decks={decks.map((deck) => ({
                id: deck.id,
                title: deck.title,
                description: deck.description,
                updatedAt: deck.updatedAt,
                cardCount: deck._count.cards,
                dueCount: deck.cards.length,
              }))}
            />
          </section>
        </section>
      </div>
    </main>
  );
}
