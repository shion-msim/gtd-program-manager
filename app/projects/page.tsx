import { auth } from "@/auth";
import { ProjectsIndexDrag } from "@/components/projects-index-drag";
import { ensureInboxForUser } from "@/lib/inbox";
import type { ProjectListRow } from "@/lib/cross-project-views";
import { getProjectsListRowsForUser } from "@/lib/cross-project-views";
import { redirect } from "next/navigation";

export default async function ProjectsIndexPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;
  await ensureInboxForUser(userId);
  const rows = await getProjectsListRowsForUser(userId);

  const byProgram = new Map<
    string,
    { programName: string; programId: string; items: ProjectListRow[] }
  >();
  for (const row of rows) {
    let g = byProgram.get(row.programId);
    if (!g) {
      g = { programName: row.programName, programId: row.programId, items: [] };
      byProgram.set(row.programId, g);
    }
    g.items.push(row);
  }

  /** getProjectsListRowsForUser がプログラム nav 順のため、その順でセクションを保持 */
  const sectionOrderIds: string[] = [];
  for (const row of rows) {
    if (!sectionOrderIds.includes(row.programId)) {
      sectionOrderIds.push(row.programId);
    }
  }
  const sections = sectionOrderIds
    .map((id) => byProgram.get(id))
    .filter((sec): sec is NonNullable<typeof sec> => sec !== undefined);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-xl font-semibold">プロジェクト一覧</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          すべてのプロジェクトからタスク一覧や受信箱へ移動できます。グリップをドラッグして並べ替えられます。
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">プロジェクトはまだありません。</p>
      ) : (
        <div className="space-y-8" data-testid="projects-index-list">
          <ProjectsIndexDrag sections={sections} />
        </div>
      )}
    </div>
  );
}
