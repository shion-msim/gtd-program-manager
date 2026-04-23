"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { programs, projects } from "@/db/schema";
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

export async function createProgram(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const nameRaw = formData.get("name");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  if (name === "") {
    return;
  }
  const startOn = parseOptionalDate(formData.get("startOn"));
  const endOn = parseOptionalDate(formData.get("endOn"));
  await db.insert(programs).values({
    userId: session.user.id,
    name,
    startOn,
    endOn,
  });
  revalidatePath("/programs");
  revalidateAppShell();
  redirect("/programs?toast=created");
}

export async function updateProgram(programId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const userId = session.user.id;
  const [existing] = await db
    .select({ id: programs.id })
    .from(programs)
    .where(and(eq(programs.id, programId), eq(programs.userId, userId)))
    .limit(1);
  if (!existing) {
    return;
  }
  const nameRaw = formData.get("name");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  if (name === "") {
    return;
  }
  const startOn = parseOptionalDate(formData.get("startOn"));
  const endOn = parseOptionalDate(formData.get("endOn"));
  await db
    .update(programs)
    .set({
      name,
      startOn,
      endOn,
      updatedAt: new Date(),
    })
    .where(and(eq(programs.id, programId), eq(programs.userId, userId)));
  revalidatePath("/programs");
  revalidatePath(`/programs/${programId}`);
  revalidateAppShell();
  redirect("/programs?toast=saved");
}

export async function deleteProgram(programId: string, formData: FormData) {
  void formData;
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }
  const userId = session.user.id;
  const [existing] = await db
    .select({ id: programs.id })
    .from(programs)
    .where(and(eq(programs.id, programId), eq(programs.userId, userId)))
    .limit(1);
  if (!existing) {
    return;
  }
  const [{ n }] = await db
    .select({ n: count() })
    .from(projects)
    .where(eq(projects.programId, programId));
  if (n > 0) {
    return;
  }
  await db
    .delete(programs)
    .where(and(eq(programs.id, programId), eq(programs.userId, userId)));
  revalidatePath("/programs");
  revalidateAppShell();
  redirect("/programs?toast=deleted");
}
