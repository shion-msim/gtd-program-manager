import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { programs } from "@/db/schema";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createProgram, deleteProgram, updateProgram } from "./actions";

const inputClass =
  "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

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
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <header>
        <h1 className="text-xl font-semibold">プログラム</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          期間付きの「桶」。配下のプロジェクトは各カードから開きます。
        </p>
      </header>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-medium">新規プログラム</h2>
        <form action={createProgram} className="space-y-3">
          <div>
            <label htmlFor="new-program-name" className="text-muted-foreground mb-1 block text-xs">
              名前（必須）
            </label>
            <input
              id="new-program-name"
              name="name"
              type="text"
              required
              className={inputClass}
              placeholder="例: 2026 Q2 イニシアチブ"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[10rem] flex-1">
              <label htmlFor="new-start" className="text-muted-foreground mb-1 block text-xs">
                開始日
              </label>
              <input id="new-start" name="startOn" type="date" className={inputClass} />
            </div>
            <div className="min-w-[10rem] flex-1">
              <label htmlFor="new-end" className="text-muted-foreground mb-1 block text-xs">
                終了日
              </label>
              <input id="new-end" name="endOn" type="date" className={inputClass} />
            </div>
          </div>
          <Button type="submit" size="sm">
            作成
          </Button>
        </form>
      </section>

      {list.length === 0 ? (
        <p className="text-muted-foreground text-sm">プログラムはまだありません。</p>
      ) : (
        <ul className="space-y-4" data-testid="programs-list">
          {list.map((p) => (
            <li
              key={p.id}
              className="divide-border space-y-3 rounded-lg border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs">
                  {p.startOn ? p.startOn : "（開始日なし）"} 〜{" "}
                  {p.endOn ? p.endOn : "（終了日なし）"}
                </p>
                <Link
                  href={`/programs/${p.id}`}
                  className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                >
                  プロジェクト
                </Link>
              </div>
              <form action={updateProgram.bind(null, p.id)} className="space-y-3">
                <div>
                  <label
                    htmlFor={`program-name-${p.id}`}
                    className="text-muted-foreground mb-1 block text-xs"
                  >
                    名前
                  </label>
                  <input
                    id={`program-name-${p.id}`}
                    name="name"
                    type="text"
                    required
                    defaultValue={p.name}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="min-w-[10rem] flex-1">
                    <label
                      htmlFor={`program-start-${p.id}`}
                      className="text-muted-foreground mb-1 block text-xs"
                    >
                      開始日
                    </label>
                    <input
                      id={`program-start-${p.id}`}
                      name="startOn"
                      type="date"
                      defaultValue={formatDateForInput(p.startOn ?? undefined)}
                      className={inputClass}
                    />
                  </div>
                  <div className="min-w-[10rem] flex-1">
                    <label
                      htmlFor={`program-end-${p.id}`}
                      className="text-muted-foreground mb-1 block text-xs"
                    >
                      終了日
                    </label>
                    <input
                      id={`program-end-${p.id}`}
                      name="endOn"
                      type="date"
                      defaultValue={formatDateForInput(p.endOn ?? undefined)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="submit" size="sm" variant="secondary">
                    保存
                  </Button>
                </div>
              </form>
              <div className="border-border border-t pt-3">
                <p className="text-muted-foreground mb-2 text-xs">
                  配下にプロジェクトが 1 件もないときだけ削除できます（子があれば先に
                  <Link href={`/programs/${p.id}`} className="underline">
                    プロジェクト側
                  </Link>
                  で空にしてください）。
                </p>
                <form action={deleteProgram.bind(null, p.id)}>
                  <Button type="submit" size="sm" variant="outline">
                    削除を試みる
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
