"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { revalidateAppShell } from "@/lib/revalidate-app-shell";
import { isTaskPriority } from "@/lib/task-priority";
import { isTaskStatus } from "@/lib/task-constants";

function revalidateTaskSurfaces(
  projectId: string,
  programId: string,
  taskId?: string,
) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/programs/${programId}`);
  revalidatePath("/programs");
  revalidatePath("/inbox");
  revalidatePath("/dashboard");
  revalidatePath("/workload");
  revalidatePath("/tasks");
  if (taskId) {
    revalidatePath(`/projects/${projectId}/tasks/${taskId}/edit`);
  }
  revalidateAppShell();
}

async function nonInboxProjectForUser(projectId: string, userId: string) {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  if (!row || row.isInbox) {
    return null;
  }
  return row;
}

async function taskInProject(
  taskId: string,
  projectId: string,
  userId: string,
) {
  const [row] = await db
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.projectId, projectId),
        eq(projects.userId, userId),
      ),
    )
    .limit(1);
  return row?.task ?? null;
}

export type AddProjectTaskResult = { ok: boolean; taskId?: string };

export async function addProjectTask(
  projectId: string,
  formData: FormData,
): Promise<AddProjectTaskResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false };
  }
  const proj = await nonInboxProjectForUser(projectId, session.user.id);
  if (!proj || proj.isArchived) {
    return { ok: false };
  }
  const titleRaw = formData.get("title");
  const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
  if (title === "") {
    return { ok: false };
  }
  const [inserted] = await db
    .insert(tasks)
    .values({
      projectId,
      title,
      status: "next",
    })
    .returning({ id: tasks.id });
  revalidateTaskSurfaces(projectId, proj.programId);
  if (!inserted?.id) {
    return { ok: false };
  }
  return { ok: true, taskId: inserted.id };
}

async function applyProjectTaskFields(
  taskId: string,
  projectId: string,
  userId: string,
  formData: FormData,
): Promise<{ ok: true; programId: string } | { ok: false }> {
  const proj = await nonInboxProjectForUser(projectId, userId);
  if (!proj) {
    return { ok: false };
  }
  const existing = await taskInProject(taskId, projectId, userId);
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
  return { ok: true, programId: proj.programId };
}

export async function updateProjectTaskStay(
  taskId: string,
  projectId: string,
  formData: FormData,
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false };
  }
  const result = await applyProjectTaskFields(
    taskId,
    projectId,
    session.user.id,
    formData,
  );
  if (!result.ok) {
    return { ok: false };
  }
  revalidateTaskSurfaces(projectId, result.programId, taskId);
  return { ok: true };
}

export async function updateProjectTaskStatus(
  taskId: string,
  projectId: string,
  formData: FormData,
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false };
  }
  const proj = await nonInboxProjectForUser(projectId, session.user.id);
  if (!proj) {
    return { ok: false };
  }
  const existing = await taskInProject(taskId, projectId, session.user.id);
  if (!existing) {
    return { ok: false };
  }
  const statusRaw = formData.get("status");
  if (typeof statusRaw !== "string" || !isTaskStatus(statusRaw)) {
    return { ok: false };
  }
  await db
    .update(tasks)
    .set({
      status: statusRaw,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));
  revalidateTaskSurfaces(projectId, proj.programId, taskId);
  return { ok: true };
}

export async function moveProjectTask(
  taskId: string,
  fromProjectId: string,
  formData: FormData,
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false };
  }
  const fromProj = await nonInboxProjectForUser(fromProjectId, session.user.id);
  if (!fromProj) {
    return { ok: false };
  }
  const existing = await taskInProject(taskId, fromProjectId, session.user.id);
  if (!existing) {
    return { ok: false };
  }
  const targetRaw = formData.get("targetProjectId");
  if (typeof targetRaw !== "string" || targetRaw === "") {
    return { ok: false };
  }
  const [target] = await db
    .select()
    .from(projects)
    .where(
      and(eq(projects.id, targetRaw), eq(projects.userId, session.user.id)),
    )
    .limit(1);
  if (!target || target.id === fromProjectId) {
    return { ok: false };
  }
  if (!target.isInbox && target.isArchived) {
    return { ok: false };
  }
  let nextStatus = existing.status;
  if (target.isInbox) {
    nextStatus = "inbox";
  } else if (existing.status === "inbox") {
    nextStatus = "next";
  }
  await db
    .update(tasks)
    .set({
      projectId: target.id,
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));
  revalidateTaskSurfaces(fromProjectId, fromProj.programId, taskId);
  revalidatePath(`/projects/${target.id}`);
  revalidatePath(`/programs/${target.programId}`);
  return { ok: true };
}

export async function deleteProjectTask(
  taskId: string,
  projectId: string,
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false };
  }
  const proj = await nonInboxProjectForUser(projectId, session.user.id);
  if (!proj) {
    return { ok: false };
  }
  const existing = await taskInProject(taskId, projectId, session.user.id);
  if (!existing) {
    return { ok: false };
  }
  await db.delete(tasks).where(eq(tasks.id, taskId));
  revalidateTaskSurfaces(projectId, proj.programId, taskId);
  return { ok: true };
}
