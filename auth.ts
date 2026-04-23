import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  accountsTable,
  authenticatorsTable,
  sessionsTable,
  usersTable,
  verificationTokensTable,
} from "@/db/schema";
import { createInboxForNewUser } from "@/lib/inbox";

const adapter = DrizzleAdapter(db, {
  usersTable,
  accountsTable,
  sessionsTable,
  verificationTokensTable,
  authenticatorsTable,
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [Google],
  events: {
    async createUser({ user }) {
      if (!user.id) {
        return;
      }
      try {
        await createInboxForNewUser(user.id);
      } catch (e) {
        console.error("Inbox 自動生成に失敗:", e);
        throw e;
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) ?? session.user.id;
      }
      return session;
    },
    authorized: ({ auth, request: { nextUrl } }) => {
      if (nextUrl.pathname.startsWith("/api/")) {
        // REST は各 Route Handler で 401。ミドルウェアではリダイレクトしない
        return true;
      }
      if (nextUrl.pathname === "/" || nextUrl.pathname === "/login") {
        return true;
      }
      if (auth?.user) {
        return true;
      }
      return NextResponse.redirect(new URL("/login", nextUrl));
    },
  },
});
