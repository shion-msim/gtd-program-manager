"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { programs, projects } from "@/db/schema";
import { nextProjectNavSortIndexForProgram } from "@/lib/nav-sort-keys";
import { parseOptionalAccentToken } from "@/lib/design-tokens";
import { revalidateAppShell } from "@/lib/revalidate-app-shell";

async function projectForUser(projectId: string, userId: string) {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createProject(
  programId: string,
  formData: FormData,
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false };
  }
  const userId = session.user.id;
  const [prog] = await db
    .select({ id: programs.id })
    .from(programs)
    .where(and(eq(programs.id, programId), eq(programs.userId, userId)))
    .limit(1);
  if (!prog) {
    return { ok: false };
  }
  const nameRaw = formData.get("name");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  if (name === "") {
    return { ok: false };
  }
  const navSortIndex = await nextProjectNavSortIndexForProgram(programId);
  await db.insert(projects).values({
    userId,
    programId,
    name,
    isInbox: false,
    navSortIndex,
  });
  revalidatePath(`/programs/${programId}`);
  revalidatePath("/programs");
  revalidatePath("/inbox");
  revalidatePath("/dashboard");
  revalidateAppShell();
  return { ok: true };
}

export async function updateProject(
  projectId: string,
  formData: FormData,
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false };
  }
  const existing = await projectForUser(projectId, session.user.id);
  if (!existing || existing.isInbox) {
    return { ok: false };
  }
  const nameRaw = formData.get("name");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  if (name === "") {
    return { ok: false };
  }
  const clearAccent = formData.get("clearAccent") === "on";
  const accentColor = clearAccent
    ? null
    : parseOptionalAccentToken(formData.get("accentColor"));
  const isArchived = formData.get("isArchived") === "on";
  await db
    .update(projects)
    .set({
      name,
      accentColor,
      isArchived,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));
  const programId = existing.programId;
  revalidatePath(`/programs/${programId}`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/programs");
  revalidatePath("/inbox");
  revalidatePath("/tasks");
  revalidateAppShell();
  return { ok: true };
}

export async function deleteProject(projectId: string): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false };
  }
  const existing = await projectForUser(projectId, session.user.id);
  if (!existing || existing.isInbox) {
    return { ok: false };
  }
  const programId = existing.programId;
  await db.delete(projects).where(eq(projects.id, projectId));
  revalidatePath(`/programs/${programId}`);
  revalidatePath("/programs");
  revalidatePath("/inbox");
  revalidatePath("/dashboard");
  revalidatePath("/workload");
  revalidateAppShell();
  return { ok: true };
}
