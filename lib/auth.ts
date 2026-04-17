import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@cardcraft.local";

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getAuthSession();
  const email = session?.user?.email?.trim().toLowerCase() || DEMO_EMAIL;
  const name = session?.user?.name?.trim() || "Demo Learner";
  const image = session?.user?.image || null;

  return prisma.user.upsert({
    where: { email },
    update: { name, image },
    create: { email, name, image },
  });
}
