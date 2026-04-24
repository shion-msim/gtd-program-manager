import { auth } from "@/auth";
import { InboxQuickAdd } from "@/components/inbox-quick-add";
import { buttonVariants } from "@/components/ui/button";
import { ensureInboxForUser } from "@/lib/inbox";
import { getInboxOpenTasksForUser } from "@/lib/inbox-tasks";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;
  await ensureInboxForUser(userId);
  const { projectId, rows } = await getInboxOpenTasksForUser(userId);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">受信箱（Inbox）</h1>
        <p className="text-muted-foreground text-sm">
          まずはここに素早く放り込みます。並べ替え・移動・〆切の整理は
          <Link
            href="/inbox/table"
            className="text-foreground mx-0.5 underline underline-offset-4"
          >
            整理ビュー
          </Link>
          の表で行えます。
        </p>
      </header>

      {!projectId ? (
        <p className="text-muted-foreground text-sm">
          Inbox プロジェクトを用意できませんでした。データベース接続を確認するか、しばらくしてから再度お試しください。
        </p>
      ) : (
        <>
          <section
            className="bg-muted/40 border-border space-y-4 rounded-2xl border p-5 shadow-sm"
            aria-labelledby="inbox-capture-heading"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2
                  id="inbox-capture-heading"
                  className="text-foreground text-base font-semibold tracking-tight"
                >
                  いま拾う
                </h2>
                <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
                  頭の中を空にするための一行キャプチャです。
                </p>
              </div>
              <Link
                href="/inbox/table"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                表で整理
              </Link>
            </div>
            <InboxQuickAdd returnPath="/inbox" />
          </section>

          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm" data-testid="inbox-empty">
              未整理のタスクはまだありません。上の欄にメモを追加できます。
            </p>
          ) : (
            <section
              className="border-border flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              aria-live="polite"
            >
              <p className="text-sm">
                未整理のタスクが{" "}
                <span className="font-semibold tabular-nums">{rows.length}</span>{" "}
                件あります。
              </p>
              <Link
                href="/inbox/table"
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-full sm:w-auto")}
              >
                整理ビューで開く
              </Link>
            </section>
          )}
        </>
      )}
    </div>
  );
}
