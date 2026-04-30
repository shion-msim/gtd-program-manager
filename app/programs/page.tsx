import { auth } from "@/auth";
import { NewProgramSection } from "@/components/new-program-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { programs } from "@/db/schema";
import { getInboxProgramIdForUser } from "@/lib/inbox";
import { ProgramsDragReorderList } from "@/components/programs-drag-reorder-list";
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
      .orderBy(asc(programs.navSortIndex), asc(programs.name)),
    getInboxProgramIdForUser(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-xl font-semibold">プログラム</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          期間付きの「桶」。配下のプロジェクトは各カードから開けます。左のグリップをドラッグして並べ替えられます（受信箱プログラムは固定）。
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
        <ProgramsDragReorderList
          inboxProgramId={inboxProgramId}
          programsOrdered={list}
          deleteProgram={deleteProgram}
        />
      )}
    </div>
  );
}
