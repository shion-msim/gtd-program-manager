import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { programs, projects } from "@/db/schema";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createProject, deleteProject, updateProject } from "./actions";

const inputClass =
  "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

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
    .select()
    .from(projects)
    .where(eq(projects.programId, programId))
    .orderBy(asc(projects.name));

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
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
            <label htmlFor="new-project-name" className="sr-only">
              プロジェクト名
            </label>
            <input
              id="new-project-name"
              name="name"
              type="text"
              required
              placeholder="プロジェクト名"
              className={inputClass}
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
          <ul className="divide-border divide-y rounded-lg border" data-testid="program-projects-list">
            {projectRows.map((proj) => (
              <li key={proj.id} className="space-y-3 p-4">
                {proj.isInbox ? (
                  <div>
                    <p className="font-medium">{proj.name}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      システム管理の Inbox です。名前の変更や削除はできません。
                    </p>
                    <p className="mt-2">
                      <Link
                        href="/inbox"
                        className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                      >
                        Inbox 画面でタスクを見る
                      </Link>
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/projects/${proj.id}`}
                        className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                      >
                        タスク一覧
                      </Link>
                    </div>
                    <form action={updateProject.bind(null, proj.id)} className="flex flex-wrap items-end gap-2">
                      <div className="min-w-0 flex-1">
                        <label htmlFor={`proj-name-${proj.id}`} className="sr-only">
                          名前
                        </label>
                        <input
                          id={`proj-name-${proj.id}`}
                          name="name"
                          type="text"
                          required
                          defaultValue={proj.name}
                          className={inputClass}
                        />
                      </div>
                      <Button type="submit" size="sm" variant="secondary">
                        保存
                      </Button>
                    </form>
                    <form action={deleteProject.bind(null, proj.id)}>
                      <Button type="submit" size="sm" variant="outline">
                        削除
                      </Button>
                    </form>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
