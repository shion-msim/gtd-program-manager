import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { getInboxProjectId } from "@/lib/inbox";

export async function getInboxTaskForEdit(userId: string, taskId: string) {
  const inboxProjectId = await getInboxProjectId(userId);
  if (!inboxProjectId) {
    return null;
  }
  const [row] = await db
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.projectId, inboxProjectId),
        eq(projects.userId, userId),
      ),
    )
    .limit(1);
  return row?.task ?? null;
}
