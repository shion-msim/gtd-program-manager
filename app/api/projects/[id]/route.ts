import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { programs, projects } from "@/db/schema";
import {
  badRequest,
  conflict,
  getSessionUserId,
  notFound,
  unauthorized,
} from "@/lib/api/route-utils";
import { getInboxProjectId } from "@/lib/inbox";
import { nextProjectNavSortIndexForProgram } from "@/lib/nav-sort-keys";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorized();
  }
  const { id } = await context.params;
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .limit(1);
  if (!row) {
    return notFound();
  }
  return NextResponse.json(row);
}

export async function PATCH(request: Request, context: Ctx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorized();
  }
  const { id } = await context.params;
  const [existing] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .limit(1);
  if (!existing) {
    return notFound();
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
  if ("name" in o && o.name !== undefined) {
    if (typeof o.name !== "string" || o.name.trim() === "") {
      return badRequest("name が不正です");
    }
  }
  const name =
    o.name === undefined
      ? undefined
      : typeof o.name === "string"
        ? o.name.trim()
        : undefined;
  if (o.programId !== undefined) {
    if (typeof o.programId !== "string" || o.programId === "") {
      return badRequest("programId が不正です");
    }
    const [prog] = await db
      .select({ id: programs.id })
      .from(programs)
      .where(
        and(eq(programs.id, o.programId), eq(programs.userId, userId)),
      )
      .limit(1);
    if (!prog) {
      return notFound();
    }
  }
  if (o.isInbox === true && !existing.isInbox) {
    const other = await getInboxProjectId(userId);
    if (other) {
      return badRequest("Inbox プロジェクトは既に存在します");
    }
  }
  const patch: {
    name?: string;
    programId?: string;
    navSortIndex?: number;
    isInbox?: boolean;
    updatedAt: Date;
  } = { updatedAt: new Date() };
  if (name !== undefined) {
    patch.name = name;
  }
  if (
    o.programId !== undefined &&
    typeof o.programId === "string"
  ) {
    patch.programId = o.programId;
    if (o.programId !== existing.programId) {
      patch.navSortIndex =
        await nextProjectNavSortIndexForProgram(o.programId);
    }
  }
  if (o.isInbox !== undefined) {
    patch.isInbox = o.isInbox === true;
  }
  const [updated] = await db
    .update(projects)
    .set(patch)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, context: Ctx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorized();
  }
  const { id } = await context.params;
  const [existing] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .limit(1);
  if (!existing) {
    return notFound();
  }
  if (existing.isInbox) {
    return conflict("Inbox プロジェクトは削除できません");
  }
  await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));
  return new NextResponse(null, { status: 204 });
}
