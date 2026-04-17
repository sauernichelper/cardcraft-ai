import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateNextReview, type ReviewResult } from "@/lib/spaced-repetition";

type CreateCardBody = {
  deckId?: string;
  front?: string;
  back?: string;
};

type UpdateCardBody = {
  id?: string;
  front?: string;
  back?: string;
  suspended?: boolean;
  result?: ReviewResult;
};

async function getOwnedCard(userId: string, cardId: string) {
  return prisma.card.findFirst({
    where: {
      id: cardId,
      deck: {
        userId,
      },
    },
    include: {
      deck: true,
    },
  });
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const deckId = searchParams.get("deckId");

  if (id) {
    const card = await getOwnedCard(user.id, id);

    if (!card) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    return NextResponse.json(card);
  }

  const cards = await prisma.card.findMany({
    where: {
      deck: {
        userId: user.id,
      },
      ...(deckId ? { deckId } : {}),
    },
    orderBy: [{ nextReview: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(cards);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = (await request.json()) as CreateCardBody;

  if (!body.deckId || !body.front?.trim() || !body.back?.trim()) {
    return NextResponse.json(
      { error: "deckId, front, and back are required." },
      { status: 400 },
    );
  }

  const deck = await prisma.deck.findFirst({
    where: {
      id: body.deckId,
      userId: user.id,
    },
  });

  if (!deck) {
    return NextResponse.json({ error: "Deck not found." }, { status: 404 });
  }

  const card = await prisma.card.create({
    data: {
      deckId: deck.id,
      front: body.front.trim(),
      back: body.back.trim(),
    },
  });

  return NextResponse.json(card, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  const body = (await request.json()) as UpdateCardBody;

  if (!body.id) {
    return NextResponse.json({ error: "Card id is required." }, { status: 400 });
  }

  const existingCard = await getOwnedCard(user.id, body.id);

  if (!existingCard) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  if (body.result) {
    const updatedCard = calculateNextReview(body.result, existingCard);

    const [card] = await prisma.$transaction([
      prisma.card.update({
        where: { id: existingCard.id },
        data: {
          nextReview: updatedCard.nextReview,
          interval: updatedCard.interval,
          easeFactor: updatedCard.easeFactor,
          repetitions: updatedCard.repetitions,
        },
      }),
      prisma.studySession.create({
        data: {
          cardId: existingCard.id,
          userId: user.id,
          result: body.result,
        },
      }),
    ]);

    return NextResponse.json(card);
  }

  const card = await prisma.card.update({
    where: { id: existingCard.id },
    data: {
      ...(body.front !== undefined ? { front: body.front.trim() } : {}),
      ...(body.back !== undefined ? { back: body.back.trim() } : {}),
      ...(body.suspended !== undefined ? { suspended: body.suspended } : {}),
    },
  });

  return NextResponse.json(card);
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Card id is required." }, { status: 400 });
  }

  const existingCard = await getOwnedCard(user.id, id);

  if (!existingCard) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  await prisma.card.delete({
    where: { id: existingCard.id },
  });

  return new NextResponse(null, { status: 204 });
}
