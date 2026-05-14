import { auth } from "@/auth";
import { ProgramProjectQuickAdd } from "@/components/program-project-quick-add";
import { ProgramProjectsDragList } from "@/components/program-projects-drag-list";
import { db } from "@/db";
import { programs, projects } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function ProgramDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;
  const { id: programId } = await params;

  const [program] = await db
    .select()
    .from(programs)
    .where(and(eq(programs.id, programId), eq(programs.userId, userId)))
    .limit(1);
  if (!program) {
    notFound();
  }

  const projectRows = await db
    .select({
      id: projects.id,
      name: projects.name,
      accentColor: projects.accentColor,
      isInbox: projects.isInbox,
      isArchived: projects.isArchived,
    })
    .from(projects)
    .where(eq(projects.programId, programId))
    .orderBy(asc(projects.navSortIndex), asc(projects.name));

  const activeProjectRows = projectRows.filter((p) => !p.isArchived);
  const archivedProjectRows = projectRows.filter((p) => !p.isInbox && p.isArchived);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm">
          <Link href="/programs" className="underline underline-offset-4">
            プログラム一覧
          </Link>
        </p>
        <h1 className="text-xl font-semibold">{program.name}</h1>
        <p className="text-muted-foreground text-sm">
          {program.startOn ? program.startOn : "（開始日なし）"} 〜{" "}
          {program.endOn ? program.endOn : "（終了日なし）"}
        </p>
      </header>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-medium">プロジェクトを追加</h2>
        <ProgramProjectQuickAdd programId={programId} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">プロジェクト一覧</h2>
        {activeProjectRows.length === 0 && archivedProjectRows.length === 0 ? (
          <p className="text-muted-foreground text-sm">まだプロジェクトがありません。</p>
        ) : (
          <ProgramProjectsDragList
            programId={programId}
            projectsOrdered={activeProjectRows}
            archivedProjects={archivedProjectRows}
          />
        )}
      </section>
    </div>
  );
}
