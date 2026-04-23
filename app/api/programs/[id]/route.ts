import { and, count, eq } from "drizzle-orm";
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

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorized();
  }
  const { id } = await context.params;
  const [program] = await db
    .select()
    .from(programs)
    .where(and(eq(programs.id, id), eq(programs.userId, userId)))
    .limit(1);
  if (!program) {
    return notFound();
  }
  const childProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.programId, id));
  return NextResponse.json({ ...program, projects: childProjects });
}

export async function PATCH(request: Request, context: Ctx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorized();
  }
  const { id } = await context.params;
  const [existing] = await db
    .select()
    .from(programs)
    .where(and(eq(programs.id, id), eq(programs.userId, userId)))
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
  const startOn =
    o.startOn === undefined
      ? undefined
      : o.startOn === null
        ? null
        : String(o.startOn);
  const endOn =
    o.endOn === undefined
      ? undefined
      : o.endOn === null
        ? null
        : String(o.endOn);
  const [updated] = await db
    .update(programs)
    .set({
      ...(name !== undefined ? { name } : {}),
      ...(startOn !== undefined ? { startOn } : {}),
      ...(endOn !== undefined ? { endOn } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(programs.id, id), eq(programs.userId, userId)))
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
    .from(programs)
    .where(and(eq(programs.id, id), eq(programs.userId, userId)))
    .limit(1);
  if (!existing) {
    return notFound();
  }
  const [{ n }] = await db
    .select({ n: count() })
    .from(projects)
    .where(eq(projects.programId, id));
  if (n > 0) {
    return conflict(
      "子プログラム（プロジェクト）が残っているため削除できません。先に中身を空にするか、プロジェクトを削除してください。",
    );
  }
  await db
    .delete(programs)
    .where(and(eq(programs.id, id), eq(programs.userId, userId)));
  return new NextResponse(null, { status: 204 });
}
