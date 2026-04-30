import { and, asc, count, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { programs, projects, tasks } from "@/db/schema";
import { ensureInboxForUser } from "@/lib/inbox";

const INBOX_OPEN_TASKS_LIMIT = 25;

export type SidebarOpenTask = { id: string; title: string };

export type SidebarProjectNav = {
  id: string;
  name: string;
  isInbox: boolean;
  openTaskCount: number;
  href: string;
  navSortIndex: number;
};

export type SidebarProgramNav = {
  id: string;
  name: string;
  accentColor: string | null;
  /** 受信箱プログラム（Inbox プロジェクトを含む） */
  isInboxProgram: boolean;
  projects: SidebarProjectNav[];
  /** 受信箱プログラム展開時: プロジェクト未割り当て＝Inbox 内の未完了タスク */
  inboxOpenTasks: SidebarOpenTask[];
  navSortIndex: number;
};

export type SidebarNavData = {
  programs: SidebarProgramNav[];
};

export async function getSidebarNavData(userId: string): Promise<SidebarNavData> {
  await ensureInboxForUser(userId);

  const [progRows, projRows, countRows, inboxTaskRows] = await Promise.all([
    db
      .select({
        id: programs.id,
        name: programs.name,
        accentColor: programs.accentColor,
        navSortIndex: programs.navSortIndex,
      })
      .from(programs)
      .where(eq(programs.userId, userId))
      .orderBy(asc(programs.navSortIndex), asc(programs.name)),
    db
      .select({
        id: projects.id,
        name: projects.name,
        programId: projects.programId,
        isInbox: projects.isInbox,
        navSortIndex: projects.navSortIndex,
      })
      .from(projects)
      .where(eq(projects.userId, userId)),
    db
      .select({
        projectId: tasks.projectId,
        n: count(),
      })
      .from(tasks)
      .where(ne(tasks.status, "done"))
      .groupBy(tasks.projectId),
    db
      .select({ id: tasks.id, title: tasks.title, projectId: tasks.projectId })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(projects.userId, userId),
          eq(projects.isInbox, true),
          ne(tasks.status, "done"),
        ),
      )
      .orderBy(desc(tasks.createdAt))
      .limit(INBOX_OPEN_TASKS_LIMIT),
  ]);

  const countMap = new Map<string, number>();
  for (const row of countRows) {
    countMap.set(row.projectId, Number(row.n));
  }

  const inboxOpenTasks: SidebarOpenTask[] = inboxTaskRows.map((t) => ({
    id: t.id,
    title: t.title,
  }));

  const byProgram = new Map<
    string,
    Omit<
      SidebarProgramNav,
      "projects" | "inboxOpenTasks" | "isInboxProgram"
    > & {
      projects: SidebarProjectNav[];
      inboxOpenTasks: SidebarOpenTask[];
      isInboxProgram: boolean;
    }
  >();

  for (const p of progRows) {
    byProgram.set(p.id, {
      id: p.id,
      name: p.name,
      accentColor: p.accentColor,
      navSortIndex: p.navSortIndex,
      isInboxProgram: false,
      projects: [],
      inboxOpenTasks: [],
    });
  }

  for (const pr of projRows) {
    const prog = byProgram.get(pr.programId);
    if (!prog) continue;
    if (pr.isInbox) prog.isInboxProgram = true;
    const openTaskCount = countMap.get(pr.id) ?? 0;
    const href = pr.isInbox ? "/inbox" : `/projects/${pr.id}`;
    prog.projects.push({
      id: pr.id,
      name: pr.name,
      isInbox: pr.isInbox,
      openTaskCount,
      href,
      navSortIndex: pr.navSortIndex,
    });
  }

  for (const prog of byProgram.values()) {
    prog.projects.sort((a, b) => {
      if (a.isInbox !== b.isInbox) return a.isInbox ? -1 : 1;
      const idx = (a.navSortIndex ?? 0) - (b.navSortIndex ?? 0);
      if (idx !== 0) return idx;
      return a.name.localeCompare(b.name, "ja");
    });
    if (prog.isInboxProgram) {
      prog.inboxOpenTasks = inboxOpenTasks;
    }
  }

  /** progRows がすでに nav 順であるため、その順で列挙 */
  const programsList: SidebarProgramNav[] = progRows.flatMap((row) => {
    const prog = byProgram.get(row.id);
    return prog ? [prog] : [];
  });

  return { programs: programsList };
}
