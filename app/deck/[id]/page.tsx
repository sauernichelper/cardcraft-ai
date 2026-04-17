import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
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

export default async function DeckPage(props: PageProps<"/deck/[id]">) {
  const { id } = await props.params;
  const user = await getCurrentUser();
  const now = new Date();

  const deck = await prisma.deck.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      cards: {
        orderBy: [{ nextReview: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!deck) {
    notFound();
  }

  const dueCount = deck.cards.filter(
    (card) => !card.suspended && card.nextReview <= now,
  ).length;

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
                <Button variant="outline" asChild className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  <Link href="/">Back home</Link>
                </Button>
                <Button asChild className="bg-amber-300 text-stone-950 hover:bg-amber-200">
                  <Link href={`/study/${deck.id}`}>Study deck</Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-2xl font-semibold">{deck.cards.length}</p>
              <p className="text-sm text-stone-300">Total cards</p>
            </div>
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-2xl font-semibold">{dueCount}</p>
              <p className="text-sm text-stone-300">Due now</p>
            </div>
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="text-2xl font-semibold">
                {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(deck.updatedAt)}
              </p>
              <p className="text-sm text-stone-300">Last updated</p>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4">
          {deck.cards.map((card, index) => (
            <Card key={card.id} className="border-0 bg-white/85 shadow-lg shadow-amber-950/8 ring-1 ring-amber-900/10">
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-lg">Card {index + 1}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={card.suspended ? "destructive" : "secondary"}>
                      {card.suspended ? "Suspended" : "Active"}
                    </Badge>
                    <Badge variant="outline">
                      Review {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(card.nextReview)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-amber-50/80 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900/70">
                    Front
                  </p>
                  <p className="text-base leading-7 text-stone-950">{card.front}</p>
                </div>
                <div className="rounded-2xl bg-stone-950 p-4 text-stone-50">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300/80">
                    Back
                  </p>
                  <p className="text-base leading-7">{card.back}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
