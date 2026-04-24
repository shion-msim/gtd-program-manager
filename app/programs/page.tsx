import { auth } from "@/auth";
import { ProgramEditDialog } from "@/components/program-edit-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { programs } from "@/db/schema";
import { getInboxProgramIdForUser } from "@/lib/inbox";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createProgram, deleteProgram } from "./actions";

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
          <form action={createProgram} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-program-name">名前（必須）</Label>
              <Input
                id="new-program-name"
                name="name"
                type="text"
                required
                placeholder="例: 2026 Q2 イニシアチブ"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="min-w-[10rem] flex-1 space-y-2">
                <Label htmlFor="new-start">開始日</Label>
                <Input id="new-start" name="startOn" type="date" />
              </div>
              <div className="min-w-[10rem] flex-1 space-y-2">
                <Label htmlFor="new-end">終了日</Label>
                <Input id="new-end" name="endOn" type="date" />
              </div>
            </div>
            <Button type="submit" size="sm">
              作成
            </Button>
          </form>
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
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-base font-semibold">{p.name}</CardTitle>
                    <p className="text-muted-foreground text-xs">
                      {p.startOn ? p.startOn : "（開始日なし）"} 〜{" "}
                      {p.endOn ? p.endOn : "（終了日なし）"}
                    </p>
                    <Link
                      href={`/programs/${p.id}`}
                      className="text-primary inline-block text-sm font-medium underline-offset-4 hover:underline"
                    >
                      プロジェクト一覧を開く
                    </Link>
                  </div>
                  <ProgramEditDialog program={p} />
                </CardHeader>
                <CardFooter className="flex flex-col items-stretch gap-2 border-t">
                  {inboxProgramId === p.id ? (
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      このプログラムには受信箱（Inbox）用のプロジェクトが常に含まれるため、子プロジェクトを
                      0 件にすることはできず、削除もできません。未整理タスクの整理は
                      <Link href="/inbox" className="text-primary mx-0.5 underline underline-offset-2">
                        受信箱
                      </Link>
                      から行えます。
                    </p>
                  ) : (
                    <>
                      <p className="text-muted-foreground text-xs">
                        配下にプロジェクトが 1 件もないときだけ削除できます（子があれば先に
                        <Link href={`/programs/${p.id}`} className="underline">
                          プロジェクト側
                        </Link>
                        で空にしてください）。
                      </p>
                      <ConfirmDeleteForm
                        action={deleteProgram.bind(null, p.id)}
                        title="このプログラムを削除しますか？"
                        description="プログラムだけが削除され、中のプロジェクトやタスクは残ります（子がある場合は削除に失敗します）。"
                        triggerLabel="削除を試みる"
                        confirmLabel="削除する"
                      />
                    </>
                  )}
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
