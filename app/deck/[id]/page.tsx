import { notFound } from "next/navigation";

import { DeckDetail } from "@/components/deck-detail";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DeckPage(props: PageProps<"/deck/[id]">) {
  const { id } = await props.params;
  const user = await getCurrentUser();

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

  return (
    <DeckDetail
      deck={{
        id: deck.id,
        title: deck.title,
        description: deck.description,
        updatedAt: deck.updatedAt.toISOString(),
      }}
      initialCards={deck.cards.map((card) => ({
        id: card.id,
        front: card.front,
        back: card.back,
        nextReview: card.nextReview.toISOString(),
        suspended: card.suspended,
      }))}
    />
  );
}
