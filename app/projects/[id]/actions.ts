"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { isTaskStatus } from "@/lib/task-constants";

function revalidateTaskSurfaces(projectId: string, programId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/programs/${programId}`);
  revalidatePath("/programs");
  revalidatePath("/inbox");
  revalidatePath("/dashboard");
  revalidatePath("/workload");
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

export async function addProjectTask(projectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const proj = await nonInboxProjectForUser(projectId, session.user.id);
  if (!proj) {
    return;
  }
  const titleRaw = formData.get("title");
  const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
  if (title === "") {
    return;
  }
  await db.insert(tasks).values({
    projectId,
    title,
    status: "next",
  });
  revalidateTaskSurfaces(projectId, proj.programId);
}

export async function updateProjectTask(
  taskId: string,
  projectId: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const proj = await nonInboxProjectForUser(projectId, session.user.id);
  if (!proj) {
    return;
  }
  const existing = await taskInProject(taskId, projectId, session.user.id);
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
  revalidateTaskSurfaces(projectId, proj.programId);
}

export async function moveProjectTask(
  taskId: string,
  fromProjectId: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const fromProj = await nonInboxProjectForUser(fromProjectId, session.user.id);
  if (!fromProj) {
    return;
  }
  const existing = await taskInProject(taskId, fromProjectId, session.user.id);
  if (!existing) {
    return;
  }
  const targetRaw = formData.get("targetProjectId");
  if (typeof targetRaw !== "string" || targetRaw === "") {
    return;
  }
  const [target] = await db
    .select()
    .from(projects)
    .where(
      and(eq(projects.id, targetRaw), eq(projects.userId, session.user.id)),
    )
    .limit(1);
  if (!target || target.id === fromProjectId) {
    return;
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
  revalidateTaskSurfaces(fromProjectId, fromProj.programId);
  revalidatePath(`/projects/${target.id}`);
  revalidatePath(`/programs/${target.programId}`);
}

export async function deleteProjectTask(
  taskId: string,
  projectId: string,
  formData: FormData,
) {
  void formData;
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const proj = await nonInboxProjectForUser(projectId, session.user.id);
  if (!proj) {
    return;
  }
  const existing = await taskInProject(taskId, projectId, session.user.id);
  if (!existing) {
    return;
  }
  await db.delete(tasks).where(eq(tasks.id, taskId));
  revalidateTaskSurfaces(projectId, proj.programId);
}
