import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { programs, projects, tasks } from "@/db/schema";
import { getInboxProjectId } from "@/lib/inbox";

export async function getInboxOpenTasksForUser(userId: string) {
  const projectId = await getInboxProjectId(userId);
  if (!projectId) {
    return { projectId: null as string | null, rows: [] };
  }
  const rows = await db
    .select()
    .from(tasks)
    .where(
      and(eq(tasks.projectId, projectId), ne(tasks.status, "done")),
    )
    .orderBy(desc(tasks.createdAt));
  return { projectId, rows };
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
    .where(and(eq(projects.userId, userId), eq(projects.isInbox, false)))
    .orderBy(asc(programs.name), asc(projects.name));
}
