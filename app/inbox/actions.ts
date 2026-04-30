"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { getInboxProjectId } from "@/lib/inbox";
import { parseInboxReturnPath } from "@/lib/inbox-return-path";
import { revalidateAppShell } from "@/lib/revalidate-app-shell";
import { isTaskPriority } from "@/lib/task-priority";
import { isTaskStatus } from "@/lib/task-constants";

function revalidateInboxRelated(taskId?: string) {
  revalidatePath("/inbox");
  revalidatePath("/inbox/table");
  revalidatePath("/dashboard");
  revalidatePath("/workload");
  revalidatePath("/tasks");
  if (taskId) {
    revalidatePath(`/inbox/tasks/${taskId}/edit`);
  }
  revalidateAppShell();
}

async function taskInUserInbox(userId: string, taskId: string) {
  const inboxProjectId = await getInboxProjectId(userId);
  if (!inboxProjectId) {
    return null;
  }
  const [row] = await db
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.projectId, inboxProjectId),
        eq(projects.userId, userId),
      ),
    )
    .limit(1);
  return row?.task ?? null;
}

export async function addInboxTask(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const userId = session.user.id;
  const titleRaw = formData.get("title");
  const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
  if (title === "") {
    return;
  }
  const projectId = await getInboxProjectId(userId);
  if (!projectId) {
    return;
  }
  await db.insert(tasks).values({
    projectId,
    title,
    status: "inbox",
  });
  revalidateInboxRelated();
  const returnPath = parseInboxReturnPath(formData);
  redirect(`${returnPath}?toast=created`);
}

async function applyInboxTaskFields(
  userId: string,
  taskId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false }> {
  const existing = await taskInUserInbox(userId, taskId);
  if (!existing) {
    return { ok: false };
  }
  const titleRaw = formData.get("title");
  const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
  if (title === "") {
    return { ok: false };
  }
  const noteRaw = formData.get("note");
  const note =
    noteRaw === null || noteRaw === undefined
      ? undefined
      : typeof noteRaw === "string"
        ? noteRaw.trim() === ""
          ? null
          : noteRaw.trim()
        : undefined;
  const dueRaw = formData.get("dueOn");
  let dueOn: string | null | undefined;
  if (dueRaw === null || dueRaw === undefined) {
    dueOn = undefined;
  } else if (typeof dueRaw === "string" && dueRaw.trim() === "") {
    dueOn = null;
  } else if (typeof dueRaw === "string") {
    dueOn = dueRaw.trim();
  } else {
    return { ok: false };
  }
  const statusRaw = formData.get("status");
  if (typeof statusRaw !== "string" || !isTaskStatus(statusRaw)) {
    return { ok: false };
  }
  if (statusRaw === "done") {
    return { ok: false };
  }
  const priorityRaw = formData.get("priority");
  if (typeof priorityRaw !== "string" || !isTaskPriority(priorityRaw)) {
    return { ok: false };
  }
  await db
    .update(tasks)
    .set({
      title,
      ...(note !== undefined ? { note } : {}),
      ...(dueOn !== undefined ? { dueOn } : {}),
      status: statusRaw,
      priority: priorityRaw,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));
  return { ok: true };
}

export async function updateInboxTaskStay(
  taskId: string,
  formData: FormData,
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false };
  }
  const applied = await applyInboxTaskFields(session.user.id, taskId, formData);
  if (!applied.ok) {
    return { ok: false };
  }
  revalidateInboxRelated(taskId);
  return { ok: true };
}

export async function updateInboxTaskStatus(
  taskId: string,
  formData: FormData,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const existing = await taskInUserInbox(session.user.id, taskId);
  if (!existing) {
    return;
  }
  const statusRaw = formData.get("status");
  if (typeof statusRaw !== "string" || !isTaskStatus(statusRaw)) {
    return;
  }
  if (statusRaw === "done") {
    return;
  }
  await db
    .update(tasks)
    .set({
      status: statusRaw,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));
  revalidateInboxRelated(taskId);
}

export async function updateInboxTask(taskId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const applied = await applyInboxTaskFields(session.user.id, taskId, formData);
  if (!applied.ok) {
    return;
  }
  revalidateInboxRelated(taskId);
  const returnPath = parseInboxReturnPath(formData);
  redirect(`${returnPath}?toast=saved`);
}

export async function moveInboxTaskToProject(taskId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const existing = await taskInUserInbox(session.user.id, taskId);
  if (!existing) {
    return;
  }
  const targetRaw = formData.get("targetProjectId");
  if (typeof targetRaw !== "string" || targetRaw === "") {
    return;
  }
  const [target] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.id, targetRaw),
        eq(projects.userId, session.user.id),
        eq(projects.isInbox, false),
      ),
    )
    .limit(1);
  if (!target) {
    return;
  }
  const nextStatus = existing.status === "inbox" ? "next" : existing.status;
  await db
    .update(tasks)
    .set({
      projectId: target.id,
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));
  revalidateInboxRelated(taskId);
  const returnPath = parseInboxReturnPath(formData);
  redirect(`${returnPath}?toast=moved`);
}

export async function deleteInboxTask(taskId: string, formData: FormData) {
  const returnPath = parseInboxReturnPath(formData);
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const existing = await taskInUserInbox(session.user.id, taskId);
  if (!existing) {
    return;
  }
  await db.delete(tasks).where(eq(tasks.id, taskId));
  revalidateInboxRelated(taskId);
  redirect(`${returnPath}?toast=deleted`);
}

export async function completeInboxTask(taskId: string, formData: FormData) {
  const returnPath = parseInboxReturnPath(formData);
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const existing = await taskInUserInbox(session.user.id, taskId);
  if (!existing) {
    return;
  }
  await db
    .update(tasks)
    .set({
      status: "done",
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));
  revalidateInboxRelated(taskId);
  redirect(`${returnPath}?toast=done`);
}
