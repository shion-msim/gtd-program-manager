import { auth } from "@/auth";
import { InboxQuickAdd } from "@/components/inbox-quick-add";
import { InboxTasksTable } from "@/components/inbox-tasks-table";
import { ensureInboxForUser } from "@/lib/inbox";
import {
  getInboxOpenTasksForUser,
  getNonInboxProjectsForUser,
} from "@/lib/inbox-tasks";
import { getPriorityColorsForUser } from "@/lib/user-priority-colors";
import { redirect } from "next/navigation";

export default async function InboxTablePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;
  await ensureInboxForUser(userId);
  const [{ projectId, rows }, moveTargets, priorityColors] = await Promise.all([
    getInboxOpenTasksForUser(userId),
    getNonInboxProjectsForUser(userId),
    getPriorityColorsForUser(userId),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">受信箱 · 整理ビュー</h1>
        <p className="text-muted-foreground text-sm">
          表形式で状態・移動・完了をまとめて扱えます。画面上の{" "}
          <span className="text-foreground font-medium">＋（いま拾う）</span>{" "}
          からいつでもキャプチャできます。素早い追加は下の入力欄からも行えます。
        </p>
      </header>

      {!projectId ? (
        <p className="text-muted-foreground text-sm">
          Inbox プロジェクトを用意できませんでした。データベース接続を確認するか、しばらくしてから再度お試しください。
        </p>
      ) : (
        <>
          <section className="max-w-3xl">
            <InboxQuickAdd returnPath="/inbox/table" />
          </section>
          <InboxTasksTable
            rows={rows}
            moveTargets={moveTargets}
            returnPath="/inbox/table"
            priorityColors={priorityColors}
          />
        </>
      )}
    </div>
  );
}
