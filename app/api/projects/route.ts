import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { programs, projects } from "@/db/schema";
import {
  badRequest,
  getSessionUserId,
  notFound,
  unauthorized,
} from "@/lib/api/route-utils";
import { getInboxProjectId } from "@/lib/inbox";
import { nextProjectNavSortIndexForProgram } from "@/lib/nav-sort-keys";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorized();
  }
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get("programId");
  if (programId) {
    const [p] = await db
      .select({ id: programs.id })
      .from(programs)
      .where(and(eq(programs.id, programId), eq(programs.userId, userId)))
      .limit(1);
    if (!p) {
      return notFound();
    }
  }
  const q = programId
    ? and(eq(projects.userId, userId), eq(projects.programId, programId))
    : eq(projects.userId, userId);
  const rows = await db
    .select()
    .from(projects)
    .where(q)
    .orderBy(asc(projects.navSortIndex), asc(projects.name));
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
  if (typeof o.programId !== "string" || o.programId === "") {
    return badRequest("programId は必須です");
  }
  if (typeof o.name !== "string" || o.name.trim() === "") {
    return badRequest("name は必須の文字列です");
  }
  const wantInbox = o.isInbox === true;
  if (wantInbox) {
    const existingInbox = await getInboxProjectId(userId);
    if (existingInbox) {
      return badRequest("Inbox プロジェクトは既に存在します");
    }
  }
  const [program] = await db
    .select({ id: programs.id })
    .from(programs)
    .where(
      and(eq(programs.id, o.programId), eq(programs.userId, userId)),
    )
    .limit(1);
  if (!program) {
    return notFound();
  }
  const navSortIndex = await nextProjectNavSortIndexForProgram(o.programId);
  const [created] = await db
    .insert(projects)
    .values({
      userId,
      programId: o.programId,
      name: o.name.trim(),
      isInbox: wantInbox,
      navSortIndex,
    })
    .returning();
  return NextResponse.json(created, { status: 201 });
}
