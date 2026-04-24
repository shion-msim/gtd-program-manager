import { auth } from "@/auth";
import { NewProgramSection } from "@/components/new-program-section";
import { ProgramDeleteWithHint } from "@/components/program-delete-with-hint";
import { ProgramEditDialog } from "@/components/program-edit-dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { programs } from "@/db/schema";
import { getInboxProgramIdForUser } from "@/lib/inbox";
import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteProgram } from "./actions";

export default async function ProgramsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const [list, inboxProgramId] = await Promise.all([
    db
      .select()
      .from(programs)
      .where(eq(programs.userId, session.user.id))
      .orderBy(desc(programs.createdAt)),
    getInboxProgramIdForUser(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-xl font-semibold">プログラム</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          期間付きの「桶」。配下のプロジェクトは各カードから開きます。
        </p>
      </header>

      <Card size="sm">
        <CardHeader>
          <CardTitle>新規プログラム</CardTitle>
        </CardHeader>
        <CardContent>
          <NewProgramSection />
        </CardContent>
      </Card>

      {list.length === 0 ? (
        <p className="text-muted-foreground text-sm">プログラムはまだありません。</p>
      ) : (
        <ul className="space-y-4" data-testid="programs-list">
          {list.map((p) => (
            <li key={p.id}>
              <Card size="sm">
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b pb-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <Link
                      href={`/programs/${p.id}`}
                      title="プロジェクト一覧を開く"
                      className="text-foreground block rounded-md outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <CardTitle className="text-base font-semibold">{p.name}</CardTitle>
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      {p.startOn ? p.startOn : "（開始日なし）"} 〜{" "}
                      {p.endOn ? p.endOn : "（終了日なし）"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-start justify-end gap-1">
                    <ProgramEditDialog program={p} />
                    {inboxProgramId !== p.id ? (
                      <ProgramDeleteWithHint programId={p.id} action={deleteProgram.bind(null, p.id)} />
                    ) : null}
                  </div>
                </CardHeader>
                {inboxProgramId === p.id ? (
                  <CardFooter className="flex flex-col items-stretch gap-2 border-t">
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      このプログラムには受信箱（Inbox）用のプロジェクトが常に含まれるため、子プロジェクトを
                      0 件にすることはできず、削除もできません。未整理タスクの整理は
                      <Link href="/inbox" className="text-primary mx-0.5 underline underline-offset-2">
                        受信箱
                      </Link>
                      から行えます。
                    </p>
                  </CardFooter>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
