import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { programs, projects, tasks } from "@/db/schema";

export type ProjectListRow = {
  projectId: string;
  projectName: string;
  isInbox: boolean;
  programId: string;
  programName: string;
};

export async function getProjectsListRowsForUser(
  userId: string,
): Promise<ProjectListRow[]> {
  return db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      isInbox: projects.isInbox,
      programId: programs.id,
      programName: programs.name,
    })
    .from(projects)
    .innerJoin(programs, eq(projects.programId, programs.id))
    .where(eq(projects.userId, userId))
    .orderBy(asc(programs.name), desc(projects.isInbox), asc(projects.name));
}

export type OpenTaskListRow = {
  taskId: string;
  title: string;
  status: string;
  dueOn: string | null;
  note: string | null;
  projectId: string;
  projectName: string;
  isInbox: boolean;
  programName: string;
};

export async function getOpenTasksListRowsForUser(
  userId: string,
  limit = 300,
): Promise<OpenTaskListRow[]> {
  return db
    .select({
      taskId: tasks.id,
      title: tasks.title,
      status: tasks.status,
      dueOn: tasks.dueOn,
      note: tasks.note,
      projectId: projects.id,
      projectName: projects.name,
      isInbox: projects.isInbox,
      programName: programs.name,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(programs, eq(projects.programId, programs.id))
    .where(and(eq(projects.userId, userId), ne(tasks.status, "done")))
    .orderBy(desc(tasks.updatedAt))
    .limit(limit);
}
