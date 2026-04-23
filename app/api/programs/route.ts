import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { programs } from "@/db/schema";
import {
  badRequest,
  getSessionUserId,
  unauthorized,
} from "@/lib/api/route-utils";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorized();
  }
  const rows = await db
    .select()
    .from(programs)
    .where(eq(programs.userId, userId))
    .orderBy(desc(programs.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorized();
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("JSON を解析できません");
  }
  if (!body || typeof body !== "object") {
    return badRequest("不正なリクエストボディ");
  }
  const o = body as Record<string, unknown>;
  if (typeof o.name !== "string" || o.name.trim() === "") {
    return badRequest("name は必須の文字列です");
  }
  const name = o.name.trim();
  const startOn =
    o.startOn === null || o.startOn === undefined
      ? null
      : String(o.startOn);
  const endOn =
    o.endOn === null || o.endOn === undefined ? null : String(o.endOn);

  const [created] = await db
    .insert(programs)
    .values({
      userId,
      name,
      startOn: startOn ?? null,
      endOn: endOn ?? null,
    })
    .returning();
  return NextResponse.json(created, { status: 201 });
}
