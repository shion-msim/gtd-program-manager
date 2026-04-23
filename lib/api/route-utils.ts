import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function unauthorized() {
  return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
}

export function notFound() {
  return NextResponse.json({ error: "見つかりません" }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
