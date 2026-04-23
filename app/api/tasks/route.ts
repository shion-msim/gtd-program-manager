import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import {
  badRequest,
  getSessionUserId,
  notFound,
  unauthorized,
} from "@/lib/api/route-utils";
import { getInboxProjectId } from "@/lib/inbox";
import { isTaskStatus } from "@/lib/task-constants";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return unauthorized();
  }
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");
  const dueBefore = searchParams.get("dueBefore");
  const dueAfter = searchParams.get("dueAfter");

  const condList = [eq(projects.userId, userId)];
  if (projectId) {
    condList.push(eq(tasks.projectId, projectId));
  }
  if (status) {
    if (!isTaskStatus(status)) {
      return badRequest("不正な status です");
    }
    condList.push(eq(tasks.status, status));
  }
  if (dueBefore) {
    const c = and(
      sql`${tasks.dueOn} is not null`,
      lte(tasks.dueOn, dueBefore),
    );
    if (c) {
      condList.push(c);
    }
  }
  if (dueAfter) {
    const c = and(
      sql`${tasks.dueOn} is not null`,
      gte(tasks.dueOn, dueAfter),
    );
    if (c) {
      condList.push(c);
    }
  }

  const whereExpr = and(...condList);
  const rows = await db
    .select({
      task: tasks,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(whereExpr)
    .orderBy(desc(tasks.createdAt));
  return NextResponse.json(rows.map((r) => r.task));
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
  if (typeof o.title !== "string" || o.title.trim() === "") {
    return badRequest("title は必須の文字列です");
  }
  const title = o.title.trim();
  let projectId: string;
  if (o.projectId === undefined || o.projectId === null) {
    const inbox = await getInboxProjectId(userId);
    if (!inbox) {
      return notFound();
    }
    projectId = inbox;
  } else {
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
    projectId = o.projectId;
  }
  const statusStr =
    o.status === undefined || o.status === null
      ? "inbox"
      : String(o.status);
  if (!isTaskStatus(statusStr)) {
    return badRequest("不正な status です");
  }
  if (o.sortOrder !== undefined && o.sortOrder !== null) {
    if (typeof o.sortOrder !== "number" || !Number.isFinite(o.sortOrder)) {
      return badRequest("sortOrder が不正です");
    }
  }
  const dueOn =
    o.dueOn === undefined
      ? null
      : o.dueOn === null
        ? null
        : String(o.dueOn);
  const note =
    o.note === undefined || o.note === null
      ? null
      : String(o.note);
  const [created] = await db
    .insert(tasks)
    .values({
      projectId,
      title,
      status: statusStr,
      dueOn,
      note,
      sortOrder:
        o.sortOrder === undefined
          ? null
          : typeof o.sortOrder === "number" && Number.isFinite(o.sortOrder)
            ? o.sortOrder
            : null,
    })
    .returning();
  return NextResponse.json(created, { status: 201 });
}
