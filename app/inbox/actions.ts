"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { getInboxProjectId } from "@/lib/inbox";
import { isTaskStatus } from "@/lib/task-constants";

function revalidateInboxRelated(taskId?: string) {
  revalidatePath("/inbox");
  revalidatePath("/dashboard");
  revalidatePath("/workload");
  if (taskId) {
    revalidatePath(`/inbox/tasks/${taskId}/edit`);
  }
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
  redirect("/inbox?toast=created");
}

export async function updateInboxTask(taskId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const existing = await taskInUserInbox(session.user.id, taskId);
  if (!existing) {
    return;
  }
  const titleRaw = formData.get("title");
  const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
  if (title === "") {
    return;
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
      title,
      ...(note !== undefined ? { note } : {}),
      ...(dueOn !== undefined ? { dueOn } : {}),
      status: statusRaw,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));
  revalidateInboxRelated(taskId);
  redirect("/inbox?toast=saved");
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
  redirect("/inbox?toast=moved");
}

export async function completeInboxTask(taskId: string, formData: FormData) {
  void formData;
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
  redirect("/inbox?toast=done");
}
