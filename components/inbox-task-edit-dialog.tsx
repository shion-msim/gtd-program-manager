"use client";

import type { ComponentProps } from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateInboxTaskStay } from "@/app/inbox/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  INBOX_EDITABLE_STATUSES,
  TASK_STATUS_LABELS,
} from "@/lib/task-constants";

function dueForInput(v: string | null | undefined): string {
  if (!v) {
    return "";
  }
  return v.slice(0, 10);
}

export type InboxTaskEditPayload = {
  id: string;
  title: string;
  note: string | null;
  dueOn: string | null;
  status: string;
};

type Props = {
  task: InboxTaskEditPayload;
  triggerLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
  triggerSize?: ComponentProps<typeof Button>["size"];
};

export function InboxTaskEditDialog({
  task,
  triggerLabel = "編集",
  triggerVariant = "secondary",
  triggerSize = "sm",
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant={triggerVariant} size={triggerSize}>
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>タスクを編集</DialogTitle>
          <DialogDescription>受信箱内のメモと〆切・状態を更新します。</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const r = await updateInboxTaskStay(task.id, fd);
              if (r.ok) {
                toast.success("保存しました");
                setOpen(false);
              } else {
                toast.error("保存できませんでした");
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={`ib-dlg-title-${task.id}`}>タイトル</Label>
            <Input
              id={`ib-dlg-title-${task.id}`}
              name="title"
              type="text"
              required
              defaultValue={task.title}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`ib-dlg-note-${task.id}`}>メモ</Label>
            <Textarea
              id={`ib-dlg-note-${task.id}`}
              name="note"
              rows={4}
              defaultValue={task.note ?? ""}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[10rem] flex-1 space-y-2">
              <Label htmlFor={`ib-dlg-due-${task.id}`}>〆切</Label>
              <Input
                id={`ib-dlg-due-${task.id}`}
                name="dueOn"
                type="date"
                defaultValue={dueForInput(task.dueOn ?? undefined)}
              />
            </div>
            <div className="min-w-[10rem] flex-1 space-y-2">
              <Label htmlFor={`ib-dlg-status-${task.id}`}>状態</Label>
              <NativeSelect
                id={`ib-dlg-status-${task.id}`}
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
          </div>
          <DialogFooter className="pt-2">
            <DialogClose render={<Button type="button" variant="outline" size="sm" />}>
              閉じる
            </DialogClose>
            <Button type="submit" size="sm" variant="secondary" disabled={pending}>
              {pending ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
