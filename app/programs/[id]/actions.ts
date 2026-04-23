"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { programs, projects } from "@/db/schema";

async function projectForUser(projectId: string, userId: string) {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createProject(programId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const userId = session.user.id;
  const [prog] = await db
    .select({ id: programs.id })
    .from(programs)
    .where(and(eq(programs.id, programId), eq(programs.userId, userId)))
    .limit(1);
  if (!prog) {
    return;
  }
  const nameRaw = formData.get("name");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  if (name === "") {
    return;
  }
  await db.insert(projects).values({
    userId,
    programId,
    name,
    isInbox: false,
  });
  revalidatePath(`/programs/${programId}`);
  revalidatePath("/programs");
  revalidatePath("/inbox");
  revalidatePath("/dashboard");
}

export async function updateProject(projectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const existing = await projectForUser(projectId, session.user.id);
  if (!existing || existing.isInbox) {
    return;
  }
  const nameRaw = formData.get("name");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  if (name === "") {
    return;
  }
  await db
    .update(projects)
    .set({
      name,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));
  revalidatePath(`/programs/${existing.programId}`);
  revalidatePath("/programs");
  revalidatePath("/inbox");
}

export async function deleteProject(projectId: string, formData: FormData) {
  void formData;
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const existing = await projectForUser(projectId, session.user.id);
  if (!existing || existing.isInbox) {
    return;
  }
  const programId = existing.programId;
  await db.delete(projects).where(eq(projects.id, projectId));
  revalidatePath(`/programs/${programId}`);
  revalidatePath("/programs");
  revalidatePath("/inbox");
  revalidatePath("/dashboard");
  revalidatePath("/workload");
}
