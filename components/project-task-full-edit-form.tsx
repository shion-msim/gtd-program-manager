"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { updateProjectTaskStay } from "@/app/projects/[id]/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProjectTaskDeleteConfirm } from "@/components/project-task-delete-confirm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/task-constants";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/lib/task-priority";
import { cn } from "@/lib/utils";
import Link from "next/link";

function dueForInput(v: string | null | undefined): string {
  if (!v) {
    return "";
  }
  return v.slice(0, 10);
}

export type ProjectTaskFullEditInitial = {
  id: string;
  title: string;
  note: string | null;
  dueOn: string | null;
  status: string;
  priority: string;
};

type Props = {
  projectId: string;
  task: ProjectTaskFullEditInitial;
};

export function ProjectTaskFullEditForm({ projectId, task }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            try {
              const r = await updateProjectTaskStay(task.id, projectId, fd);
              if (r.ok) {
                toast.success("保存しました");
                router.push(`/projects/${projectId}`);
              } else {
                toast.error("保存できませんでした");
              }
            } catch {
              toast.error("保存できませんでした");
            }
          });
        }}
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
          <Textarea id="note" name="note" rows={4} defaultValue={task.note ?? ""} />
        </div>
        <div className="token-form-row">
          <div className="token-form-field-col">
            <Label htmlFor="dueOn">〆切</Label>
            <Input
              id="dueOn"
              name="dueOn"
              type="date"
              defaultValue={dueForInput(task.dueOn ?? undefined)}
            />
          </div>
          <div className="token-form-field-col">
            <Label htmlFor="status">状態</Label>
            <NativeSelect id="status" name="status" required defaultValue={task.status}>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="token-form-field-col">
            <Label htmlFor="priority">優先度</Label>
            <NativeSelect id="priority" name="priority" required defaultValue={task.priority}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" variant="secondary" disabled={pending}>
            {pending ? "保存中…" : "保存"}
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
        <p className="text-muted-foreground mb-2 text-sm font-medium">危険な操作</p>
        <ProjectTaskDeleteConfirm
          taskId={task.id}
          projectId={projectId}
          title="このタスクを削除しますか？"
          description="削除すると元に戻せません。"
          triggerLabel="削除"
          confirmLabel="削除する"
          triggerVariant="destructive"
          onDeleted={() => {
            router.push(`/projects/${projectId}`);
          }}
        />
      </div>
    </div>
  );
}
