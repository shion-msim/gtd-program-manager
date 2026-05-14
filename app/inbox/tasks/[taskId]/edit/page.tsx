import { auth } from "@/auth";
import { InboxTaskFullEditForm } from "@/components/inbox-task-full-edit-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInboxTaskForEdit } from "@/lib/inbox-task-edit";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ taskId: string }> };

export default async function InboxTaskEditPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const { taskId } = await params;
  const task = await getInboxTaskForEdit(session.user.id, taskId);
  if (!task) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <p className="text-muted-foreground text-sm">
        <Link href="/inbox/table" className="text-foreground underline underline-offset-4">
          受信箱（整理ビュー）へ戻る
        </Link>
      </p>
      <header>
        <h1 className="text-xl font-semibold">タスクを編集</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          受信箱内のメモと〆切・状態を更新するか、削除できます。
        </p>
      </header>

      <Card size="sm">
        <CardHeader>
          <CardTitle>内容</CardTitle>
          <CardDescription>保存すると受信箱一覧に戻ります。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <InboxTaskFullEditForm
            task={{
              id: taskId,
              title: task.title,
              note: task.note,
              dueOn: task.dueOn,
              status: task.status,
              priority: task.priority,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
