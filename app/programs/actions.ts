"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { programs, projects } from "@/db/schema";
import { parseOptionalAccentToken } from "@/lib/design-tokens";
import { nextProgramNavSortIndex } from "@/lib/nav-sort-keys";
import { revalidateAppShell } from "@/lib/revalidate-app-shell";

function parseOptionalDate(raw: FormDataEntryValue | null): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (typeof raw !== "string") {
    return null;
  }
  const t = raw.trim();
  return t === "" ? null : t;
}

export async function createProgram(
  formData: FormData,
): Promise<{ ok: true; id: string } | { ok: false }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false };
  }
  const nameRaw = formData.get("name");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  if (name === "") {
    return { ok: false };
  }
  const startOn = parseOptionalDate(formData.get("startOn"));
  const endOn = parseOptionalDate(formData.get("endOn"));
  const clearAccent = formData.get("clearAccent") === "on";
  const accentColor = clearAccent
    ? null
    : parseOptionalAccentToken(formData.get("accentColor"));
  const navSortIndex = await nextProgramNavSortIndex(session.user.id);
  const [row] = await db
    .insert(programs)
    .values({
      userId: session.user.id,
      name,
      startOn,
      endOn,
      accentColor,
      navSortIndex,
    })
    .returning({ id: programs.id });
  if (!row) {
    return { ok: false };
  }
  revalidatePath("/programs");
  revalidateAppShell();
  return { ok: true, id: row.id };
}

export async function updateProgram(
  programId: string,
  formData: FormData,
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false };
  }
  const userId = session.user.id;
  const [existing] = await db
    .select({ id: programs.id })
    .from(programs)
    .where(and(eq(programs.id, programId), eq(programs.userId, userId)))
    .limit(1);
  if (!existing) {
    return { ok: false };
  }
  const nameRaw = formData.get("name");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  if (name === "") {
    return { ok: false };
  }
  const startOn = parseOptionalDate(formData.get("startOn"));
  const endOn = parseOptionalDate(formData.get("endOn"));
  const clearAccent = formData.get("clearAccent") === "on";
  const accentColor = clearAccent
    ? null
    : parseOptionalAccentToken(formData.get("accentColor"));
  await db
    .update(programs)
    .set({
      name,
      startOn,
      endOn,
      accentColor,
      updatedAt: new Date(),
    })
    .where(and(eq(programs.id, programId), eq(programs.userId, userId)));
  revalidatePath("/programs");
  revalidatePath(`/programs/${programId}`);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/workload");
  revalidateAppShell();
  return { ok: true };
}

export async function deleteProgram(programId: string): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false };
  }
  const userId = session.user.id;
  const [existing] = await db
    .select({ id: programs.id })
    .from(programs)
    .where(and(eq(programs.id, programId), eq(programs.userId, userId)))
    .limit(1);
  if (!existing) {
    return { ok: false };
  }
  const [{ n }] = await db
    .select({ n: count() })
    .from(projects)
    .where(eq(projects.programId, programId));
  if (n > 0) {
    return { ok: false };
  }
  await db
    .delete(programs)
    .where(and(eq(programs.id, programId), eq(programs.userId, userId)));
  revalidatePath("/programs");
  revalidateAppShell();
  return { ok: true };
}
