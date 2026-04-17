import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CredentialsInput = {
  email?: string;
  password?: string;
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = (credentials ?? {}) as CredentialsInput;
          const normalizedEmail = email?.trim().toLowerCase();
          const normalizedPassword = password?.trim();

          if (!normalizedEmail || !normalizedPassword) {
            return null;
          }

          // The current Prisma schema does not store a password hash yet.
          // Fail closed rather than allowing an insecure login path.
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!user) {
            return null;
          }

          console.error(
            "Credentials authentication is configured, but password verification is not implemented for this schema.",
          );

          return null;
        } catch (error) {
          console.error("Failed to authorize credentials.", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
