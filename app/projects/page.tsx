import { auth } from "@/auth";
import { ensureInboxForUser } from "@/lib/inbox";
import { getProjectsListRowsForUser } from "@/lib/cross-project-views";
import Link from "next/link";
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
    { programName: string; programId: string; items: typeof rows }
  >();
  for (const row of rows) {
    let g = byProgram.get(row.programId);
    if (!g) {
      g = { programName: row.programName, programId: row.programId, items: [] };
      byProgram.set(row.programId, g);
    }
    g.items.push(row);
  }
  const sections = [...byProgram.values()].sort((a, b) =>
    a.programName.localeCompare(b.programName, "ja"),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-xl font-semibold">プロジェクト一覧</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          すべてのプロジェクトからタスク一覧や受信箱へ移動できます。
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">プロジェクトはまだありません。</p>
      ) : (
        <div className="space-y-8" data-testid="projects-index-list">
          {sections.map((sec) => (
            <section key={sec.programId} className="space-y-2">
              <h2 className="text-sm font-medium">
                <Link
                  href={`/programs/${sec.programId}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {sec.programName}
                </Link>
              </h2>
              <ul className="divide-border divide-y rounded-lg border text-sm">
                {sec.items.map((row) => {
                  const href = row.isInbox ? "/inbox" : `/projects/${row.projectId}`;
                  const suffix = row.isInbox ? "（受信箱）" : null;
                  return (
                    <li key={row.projectId} className="px-3 py-3">
                      <Link
                        href={href}
                        className="text-primary font-medium underline-offset-4 hover:underline"
                      >
                        {row.projectName}
                        {suffix}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
