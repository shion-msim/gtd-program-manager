import { auth } from "@/auth";
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
import Link from "next/link";
import { redirect } from "next/navigation";
import { createProgram, deleteProgram, updateProgram } from "./actions";

function formatDateForInput(v: string | null | undefined): string {
  if (!v) {
    return "";
  }
  return v.slice(0, 10);
}

export default async function ProgramsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const list = await db
    .select()
    .from(programs)
    .where(eq(programs.userId, session.user.id))
    .orderBy(desc(programs.createdAt));

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
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 border-b pb-4">
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {p.startOn ? p.startOn : "（開始日なし）"} 〜{" "}
                      {p.endOn ? p.endOn : "（終了日なし）"}
                    </p>
                    <Link
                      href={`/programs/${p.id}`}
                      className="text-primary mt-1 inline-block text-sm font-medium underline-offset-4 hover:underline"
                    >
                      プロジェクト一覧を開く
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <form action={updateProgram.bind(null, p.id)} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`program-name-${p.id}`}>名前</Label>
                      <Input
                        id={`program-name-${p.id}`}
                        name="name"
                        type="text"
                        required
                        defaultValue={p.name}
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="min-w-[10rem] flex-1 space-y-2">
                        <Label htmlFor={`program-start-${p.id}`}>開始日</Label>
                        <Input
                          id={`program-start-${p.id}`}
                          name="startOn"
                          type="date"
                          defaultValue={formatDateForInput(p.startOn ?? undefined)}
                        />
                      </div>
                      <div className="min-w-[10rem] flex-1 space-y-2">
                        <Label htmlFor={`program-end-${p.id}`}>終了日</Label>
                        <Input
                          id={`program-end-${p.id}`}
                          name="endOn"
                          type="date"
                          defaultValue={formatDateForInput(p.endOn ?? undefined)}
                        />
                      </div>
                    </div>
                    <Button type="submit" size="sm" variant="secondary">
                      保存
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-2 border-t">
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
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
