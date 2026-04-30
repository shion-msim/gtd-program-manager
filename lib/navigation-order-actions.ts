"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { programs, projects } from "@/db/schema";
import { getInboxProgramIdForUser } from "@/lib/inbox";
import { revalidateAppShell } from "@/lib/revalidate-app-shell";

function idsMatch(a: readonly string[], b: readonly string[]) {
  if (a.length !== b.length) {
    return false;
  }
  const setB = new Set(b);
  if (setB.size !== b.length) {
    return false;
  }
  for (const id of a) {
    if (!setB.has(id)) {
      return false;
    }
  }
  return true;
}

/** 受信箱プログラム以外のみ。先頭〜末尾の並び順の ID を渡す（受信箱プログラム ID は含めない） */
export async function reorderProgramsForNavigation(
  orderedNonInboxProgramIds: string[],
): Promise<{ ok: boolean }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false };
  }
  const inboxProgramId = await getInboxProgramIdForUser(userId);
  if (orderedNonInboxProgramIds.some((id) => id === inboxProgramId)) {
    return { ok: false };
  }

  const allRows = await db
    .select({ id: programs.id })
    .from(programs)
    .where(eq(programs.userId, userId));
  const allIds = allRows.map((r) => r.id);
  const nonInboxExpected = inboxProgramId
    ? allIds.filter((id) => id !== inboxProgramId)
    : allIds;
  if (
    orderedNonInboxProgramIds.some((id) => !nonInboxExpected.includes(id))
  ) {
    return { ok: false };
  }
  if (!idsMatch(orderedNonInboxProgramIds, nonInboxExpected)) {
    return { ok: false };
  }

  const now = new Date();
  const baseSort = inboxProgramId !== null ? 1 : 0;
  for (let i = 0; i < orderedNonInboxProgramIds.length; i++) {
    const id = orderedNonInboxProgramIds[i];
    await db
      .update(programs)
      .set({ navSortIndex: baseSort + i, updatedAt: now })
      .where(and(eq(programs.id, id), eq(programs.userId, userId)));
  }

  if (inboxProgramId !== null) {
    await db
      .update(programs)
      .set({ navSortIndex: 0, updatedAt: now })
      .where(and(eq(programs.id, inboxProgramId), eq(programs.userId, userId)));
  }

  revalidatePath("/programs");
  revalidatePath("/projects");
  revalidateAppShell();
  return { ok: true };
}

/** 同一プログラム内の受信箱プロジェクト以外のみ、先頭からの並び順 */
export async function reorderProjectsInProgram(
  programId: string,
  orderedNonInboxProjectIds: string[],
): Promise<{ ok: boolean }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false };
  }

  const [progRow] = await db
    .select({ id: programs.id })
    .from(programs)
    .where(and(eq(programs.id, programId), eq(programs.userId, userId)))
    .limit(1);
  if (!progRow) {
    return { ok: false };
  }

  const rows = await db
    .select({ id: projects.id, isInbox: projects.isInbox })
    .from(projects)
    .where(and(eq(projects.programId, programId), eq(projects.userId, userId)));

  const nonInboxIds = rows.filter((r) => !r.isInbox).map((r) => r.id);
  const inboxRows = rows.filter((r) => r.isInbox);
  const inboxProjId =
    inboxRows.length > 0 && inboxRows[0] ? inboxRows[0].id : null;

  if (orderedNonInboxProjectIds.some((id) => id === inboxProjId)) {
    return { ok: false };
  }
  if (!idsMatch(orderedNonInboxProjectIds, nonInboxIds)) {
    return { ok: false };
  }

  const now = new Date();
  if (inboxProjId) {
    await db
      .update(projects)
      .set({ navSortIndex: 0, updatedAt: now })
      .where(
        and(
          eq(projects.id, inboxProjId),
          eq(projects.userId, userId),
          eq(projects.programId, programId),
        ),
      );
  }

  for (let i = 0; i < orderedNonInboxProjectIds.length; i++) {
    const id = orderedNonInboxProjectIds[i];
    await db
      .update(projects)
      .set({ navSortIndex: i + 1, updatedAt: now })
      .where(
        and(
          eq(projects.id, id),
          eq(projects.userId, userId),
          eq(projects.programId, programId),
          eq(projects.isInbox, false),
        ),
      );
  }

  revalidatePath("/programs");
  revalidatePath("/projects");
  revalidatePath(`/programs/${programId}`);
  revalidateAppShell();
  return { ok: true };
}
