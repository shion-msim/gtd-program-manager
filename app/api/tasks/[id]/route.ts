import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import {
  badRequest,
  getSessionUserId,
  notFound,
  unauthorized,
} from "@/lib/api/route-utils";
import { isTaskStatus } from "@/lib/task-constants";

type Ctx = { params: Promise<{ id: string }> };

async function taskForUser(taskId: string, userId: string) {
  const [row] = await db
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(and(eq(tasks.id, taskId), eq(projects.userId, userId)))
    .limit(1);
  return row?.task ?? null;
}

export async function GET(_request: Request, context: Ctx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorized();
  }
  const { id } = await context.params;
  const task = await taskForUser(id, userId);
  if (!task) {
    return notFound();
  }
  return NextResponse.json(task);
}

export async function PATCH(request: Request, context: Ctx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorized();
  }
  const { id } = await context.params;
  const existing = await taskForUser(id, userId);
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
  if ("title" in o && o.title !== undefined) {
    if (typeof o.title !== "string" || o.title.trim() === "") {
      return badRequest("title が不正です");
    }
  }
  if (o.status !== undefined) {
    if (typeof o.status !== "string" || !isTaskStatus(o.status)) {
      return badRequest("不正な status です");
    }
  }
  if (o.sortOrder !== undefined && o.sortOrder !== null) {
    if (typeof o.sortOrder !== "number" || !Number.isFinite(o.sortOrder)) {
      return badRequest("sortOrder が不正です");
    }
  }
  let nextProjectId = existing.projectId;
  if (o.projectId !== undefined) {
    if (o.projectId === null) {
      return badRequest("projectId は null にできません");
    }
    if (typeof o.projectId !== "string") {
      return badRequest("projectId が不正です");
    }
    const [p] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(eq(projects.id, o.projectId), eq(projects.userId, userId)),
      )
      .limit(1);
    if (!p) {
      return notFound();
    }
    nextProjectId = o.projectId;
  }

  const title =
    o.title === undefined
      ? undefined
      : typeof o.title === "string"
        ? o.title.trim()
        : undefined;
  const status =
    o.status === undefined ? undefined : o.status;
  const dueOn =
    o.dueOn === undefined
      ? undefined
      : o.dueOn === null
        ? null
        : String(o.dueOn);
  const note =
    o.note === undefined
      ? undefined
      : o.note === null
        ? null
        : String(o.note);
  const sortOrder =
    o.sortOrder === undefined
      ? undefined
      : o.sortOrder === null
        ? null
        : typeof o.sortOrder === "number" && Number.isFinite(o.sortOrder)
          ? o.sortOrder
          : undefined;
  if (o.sortOrder !== undefined && sortOrder === undefined) {
    return badRequest("sortOrder が不正です");
  }

  const [updated] = await db
    .update(tasks)
    .set({
      ...(title !== undefined ? { title } : {}),
      ...(status !== undefined && typeof status === "string"
        ? { status: status }
        : {}),
      projectId: nextProjectId,
      ...(dueOn !== undefined ? { dueOn } : {}),
      ...(note !== undefined ? { note } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, context: Ctx) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorized();
  }
  const { id } = await context.params;
  const existing = await taskForUser(id, userId);
  if (!existing) {
    return notFound();
  }
  await db.delete(tasks).where(eq(tasks.id, id));
  return new NextResponse(null, { status: 204 });
}
