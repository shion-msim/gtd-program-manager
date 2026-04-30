import { auth } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInboxTaskForEdit } from "@/lib/inbox-task-edit";
import {
  INBOX_EDITABLE_STATUSES,
  TASK_STATUS_LABELS,
} from "@/lib/task-constants";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/lib/task-priority";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteInboxTask, updateInboxTask } from "@/app/inbox/actions";

function dueForInput(v: string | null | undefined): string {
  if (!v) {
    return "";
  }
  return v.slice(0, 10);
}

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
        <Link href="/inbox" className="text-foreground underline underline-offset-4">
          受信箱へ戻る
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
          <form action={updateInboxTask.bind(null, taskId)} className="space-y-4">
            <input type="hidden" name="returnPath" value="/inbox" />
            <div className="space-y-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                name="title"
                type="text"
                required
                defaultValue={task.title}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">メモ</Label>
              <Textarea
                id="note"
                name="note"
                rows={4}
                defaultValue={task.note ?? ""}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[10rem] flex-1 space-y-2">
                <Label htmlFor="dueOn">〆切</Label>
                <Input
                  id="dueOn"
                  name="dueOn"
                  type="date"
                  defaultValue={dueForInput(task.dueOn ?? undefined)}
                />
              </div>
              <div className="min-w-[10rem] flex-1 space-y-2">
                <Label htmlFor="status">状態</Label>
                <NativeSelect
                  id="status"
                  name="status"
                  required
                  defaultValue={task.status}
                >
                  {INBOX_EDITABLE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {TASK_STATUS_LABELS[s]}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="min-w-[10rem] flex-1 space-y-2">
                <Label htmlFor="priority">優先度</Label>
                <NativeSelect
                  id="priority"
                  name="priority"
                  required
                  defaultValue={task.priority}
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {TASK_PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" variant="secondary">
                保存
              </Button>
              <Link
                href="/inbox"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                キャンセル
              </Link>
            </div>
          </form>
          <div className="border-t pt-4">
            <p className="text-muted-foreground mb-2 text-sm font-medium">危険な操作</p>
            <ConfirmDeleteForm
              action={deleteInboxTask.bind(null, taskId)}
              title="このタスクを削除しますか？"
              description="削除すると元に戻せません。"
              triggerLabel="削除"
              confirmLabel="削除する"
              triggerVariant="destructive"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
