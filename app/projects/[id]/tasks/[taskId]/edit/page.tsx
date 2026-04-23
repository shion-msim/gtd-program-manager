import { auth } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { getProjectTaskForEdit } from "@/lib/project-task-edit";
import { TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/task-constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  deleteProjectTask,
  updateProjectTask,
} from "@/app/projects/[id]/actions";

function dueForInput(v: string | null | undefined): string {
  if (!v) {
    return "";
  }
  return v.slice(0, 10);
}

type Props = { params: Promise<{ id: string; taskId: string }> };

export default async function ProjectTaskEditPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const { id: projectId, taskId } = await params;
  const row = await getProjectTaskForEdit(session.user.id, projectId, taskId);
  if (!row) {
    notFound();
  }
  const { task, program, project } = row;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <p className="text-muted-foreground text-sm">
        <Link href="/programs" className="underline underline-offset-4">
          プログラム一覧
        </Link>
        {" · "}
        <Link
          href={`/programs/${program.id}`}
          className="underline underline-offset-4"
        >
          {program.name}
        </Link>
        {" · "}
        <Link
          href={`/projects/${projectId}`}
          className="underline underline-offset-4"
        >
          {project.name}
        </Link>
      </p>
      <header>
        <h1 className="text-xl font-semibold">タスクを編集</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          メモ・〆切・状態を更新するか、削除できます。
        </p>
      </header>

      <Card size="sm">
        <CardHeader>
          <CardTitle>内容</CardTitle>
          <CardDescription>保存するとプロジェクトのタスク一覧に戻ります。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            action={updateProjectTask.bind(null, taskId, projectId)}
            className="space-y-4"
          >
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
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {TASK_STATUS_LABELS[s]}
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
                href={`/projects/${projectId}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                キャンセル
              </Link>
            </div>
          </form>

          <div className="border-t pt-4">
            <p className="text-muted-foreground mb-2 text-sm font-medium">
              危険な操作
            </p>
            <ConfirmDeleteForm
              action={deleteProjectTask.bind(null, taskId, projectId)}
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
