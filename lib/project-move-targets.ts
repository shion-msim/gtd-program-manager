import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { programs, projects } from "@/db/schema";

export type ProjectMoveTarget = {
  projectId: string;
  programName: string;
  projectName: string;
  isInbox: boolean;
};

/** 移動先一覧（自分の全プロジェクトから指定を除く。Inbox を含む） */
export async function getOtherProjectsForMove(
  userId: string,
  excludeProjectId: string,
): Promise<ProjectMoveTarget[]> {
  return db
    .select({
      projectId: projects.id,
      programName: programs.name,
      projectName: projects.name,
      isInbox: projects.isInbox,
    })
    .from(projects)
    .innerJoin(programs, eq(projects.programId, programs.id))
    .where(
      and(
        eq(projects.userId, userId),
        ne(projects.id, excludeProjectId),
        eq(projects.isArchived, false),
      ),
    )
    .orderBy(
      desc(projects.isInbox),
      asc(programs.navSortIndex),
      asc(programs.name),
      asc(projects.navSortIndex),
      asc(projects.name),
    );
}
