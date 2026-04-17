import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CreateDeckBody = {
  title?: string;
  description?: string;
  cards?: Array<{
    front?: string;
    back?: string;
  }>;
};

export async function GET() {
  const user = await getCurrentUser();
  const now = new Date();

  const decks = await prisma.deck.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          cards: true,
        },
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

  return NextResponse.json(
    decks.map((deck) => ({
      id: deck.id,
      title: deck.title,
      description: deck.description,
      updatedAt: deck.updatedAt,
      cardCount: deck._count.cards,
      dueCount: deck.cards.length,
    })),
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = (await request.json()) as CreateDeckBody;

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const cards = (body.cards ?? [])
    .filter((card) => card.front?.trim() && card.back?.trim())
    .map((card) => ({
      front: card.front!.trim(),
      back: card.back!.trim(),
    }));

  const deck = await prisma.deck.create({
    data: {
      title: body.title.trim(),
      description: body.description?.trim() || null,
      userId: user.id,
      cards: cards.length ? { create: cards } : undefined,
    },
    include: {
      _count: {
        select: {
          cards: true,
        },
      },
    },
  });

  return NextResponse.json(
    {
      id: deck.id,
      title: deck.title,
      description: deck.description,
      updatedAt: deck.updatedAt,
      cardCount: deck._count.cards,
    },
    { status: 201 },
  );
}
