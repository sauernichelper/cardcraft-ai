import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@cardcraft.local";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();

        if (!email) {
          return null;
        }

        const name = credentials?.name?.trim() || email.split("@")[0];
        const user = await prisma.user.upsert({
          where: { email },
          update: { name },
          create: { email, name },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = token.email ?? session.user.email ?? "";
        session.user.name = token.name ?? session.user.name;
        session.user.image = typeof token.picture === "string" ? token.picture : session.user.image;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

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
