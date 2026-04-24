import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
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
import { ensureE2eUser } from "@/lib/e2e-user";
import { ensureInboxForUser } from "@/lib/inbox";

const adapter = DrizzleAdapter(db, {
  usersTable,
  accountsTable,
  sessionsTable,
  verificationTokensTable,
  authenticatorsTable,
});

const e2eCredentials =
  process.env.E2E_AUTH_ENABLED === "1"
    ? [
        Credentials({
          id: "e2e-credentials",
          name: "E2E",
          credentials: {
            secret: { label: "E2E シークレット", type: "password" },
          },
          async authorize(credentials) {
            const secret = credentials?.secret;
            if (
              typeof secret !== "string" ||
              secret !== process.env.E2E_AUTH_SECRET
            ) {
              return null;
            }
            const u = await ensureE2eUser();
            return { id: u.id, name: u.name, email: u.email };
          },
        }),
      ]
    : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [Google, ...e2eCredentials],
  events: {
    async createUser({ user }) {
      if (!user.id) {
        return;
      }
      try {
        await ensureInboxForUser(user.id);
      } catch (e) {
        console.error("Inbox 自動生成に失敗:", e);
        throw e;
      }
    },
    /** 既存ユーザー（createUser 以前の登録・初回作成失敗など）も毎回冪等に補完する */
    async signIn({ user }) {
      if (!user.id) {
        return;
      }
      try {
        await ensureInboxForUser(user.id);
      } catch (e) {
        console.error("Inbox 確保に失敗:", e);
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
      // `app/icon.png` / `app/apple-icon.png` は拡張子なしの /icon, /apple-icon として配信される
      if (
        nextUrl.pathname === "/icon" ||
        nextUrl.pathname === "/apple-icon" ||
        nextUrl.pathname === "/favicon.ico" ||
        nextUrl.pathname === "/manifest.webmanifest"
      ) {
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
