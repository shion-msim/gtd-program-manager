import { auth } from "@/auth";
import { ProgramProjectsDragList } from "@/components/program-projects-drag-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { programs, projects } from "@/db/schema";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createProject, deleteProject } from "./actions";

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
    })
    .from(projects)
    .where(eq(projects.programId, programId))
    .orderBy(asc(projects.navSortIndex), asc(projects.name));

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
        <form action={createProject.bind(null, programId)} className="flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1">
            <Label htmlFor="new-project-name" className="sr-only">
              プロジェクト名
            </Label>
            <Input
              id="new-project-name"
              name="name"
              type="text"
              required
              placeholder="プロジェクト名"
            />
          </div>
          <Button type="submit" size="sm">
            追加
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">プロジェクト一覧</h2>
        {projectRows.length === 0 ? (
          <p className="text-muted-foreground text-sm">まだプロジェクトがありません。</p>
        ) : (
          <ProgramProjectsDragList
            programId={programId}
            projectsOrdered={projectRows}
            deleteProject={deleteProject}
          />
        )}
      </section>
    </div>
  );
}
