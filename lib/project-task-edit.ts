import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { programs, projects, tasks } from "@/db/schema";

export async function getProjectTaskForEdit(
  userId: string,
  projectId: string,
  taskId: string,
) {
  const [row] = await db
    .select({
      task: tasks,
      program: programs,
      project: projects,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(programs, eq(projects.programId, programs.id))
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.projectId, projectId),
        eq(projects.userId, userId),
      ),
    )
    .limit(1);
  if (!row || row.project.isInbox) {
    return null;
  }
  return row;
}
