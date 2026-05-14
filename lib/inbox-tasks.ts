import { and, asc, desc, eq, ne } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { db } from "@/db";
import { programs, projects, tasks } from "@/db/schema";
import { getInboxProjectId } from "@/lib/inbox";

export type InboxOpenTaskRow = InferSelectModel<typeof tasks> & {
  projectAccent: string | null;
  programAccent: string | null;
};

export async function getInboxOpenTasksForUser(userId: string) {
  const projectId = await getInboxProjectId(userId);
  if (!projectId) {
    return { projectId: null as string | null, rows: [] as InboxOpenTaskRow[] };
  }
  const rows = await db
    .select({
      task: tasks,
      projectAccent: projects.accentColor,
      programAccent: programs.accentColor,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(programs, eq(projects.programId, programs.id))
    .where(
      and(eq(tasks.projectId, projectId), ne(tasks.status, "done")),
    )
    .orderBy(desc(tasks.createdAt));
  const flat: InboxOpenTaskRow[] = rows.map((r) => ({
    ...r.task,
    projectAccent: r.projectAccent,
    programAccent: r.programAccent,
  }));
  return { projectId, rows: flat };
}

/** Inbox 以外のプロジェクト（移動先）。プログラム名・プロジェクト名でソート */
export async function getNonInboxProjectsForUser(userId: string) {
  return db
    .select({
      projectId: projects.id,
      programName: programs.name,
      projectName: projects.name,
    })
    .from(projects)
    .innerJoin(programs, eq(projects.programId, programs.id))
    .where(
      and(
        eq(projects.userId, userId),
        eq(projects.isInbox, false),
        eq(projects.isArchived, false),
      ),
    )
    .orderBy(
      asc(programs.navSortIndex),
      asc(programs.name),
      asc(projects.navSortIndex),
      asc(projects.name),
    );
}
