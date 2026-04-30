import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { programs, projects } from "@/db/schema";

export async function nextProgramNavSortIndex(userId: string): Promise<number> {
  const [row] = await db
    .select({
      maxIdx: sql<number>`coalesce(max(${programs.navSortIndex}), -1)`.mapWith(
        Number,
      ),
    })
    .from(programs)
    .where(eq(programs.userId, userId));
  return (row?.maxIdx ?? -1) + 1;
}

export async function nextProjectNavSortIndexForProgram(
  programId: string,
): Promise<number> {
  const [row] = await db
    .select({
      maxIdx: sql<number>`coalesce(max(${projects.navSortIndex}), -1)`.mapWith(
        Number,
      ),
    })
    .from(projects)
    .where(eq(projects.programId, programId));
  return (row?.maxIdx ?? -1) + 1;
}
