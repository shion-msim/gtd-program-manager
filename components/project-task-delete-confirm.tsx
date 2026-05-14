"use client";

import type { ComponentProps } from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteProjectTask } from "@/app/projects/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  taskId: string;
  projectId: string;
  title: string;
  description?: string;
  triggerLabel?: string;
  confirmLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
  onDeleted: () => void;
};

export function ProjectTaskDeleteConfirm({
  taskId,
  projectId,
  title,
  description = "削除すると元に戻せません。",
  triggerLabel = "削除",
  confirmLabel = "削除する",
  triggerVariant = "destructive",
  onDeleted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const triggerButton = (
    <Button type="button" variant={triggerVariant} size="sm">
      {triggerLabel}
    </Button>
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={triggerButton} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">キャンセル</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                try {
                  const r = await deleteProjectTask(taskId, projectId);
                  if (r.ok) {
                    toast.success("削除しました");
                    setOpen(false);
                    onDeleted();
                  } else {
                    toast.error("削除できませんでした");
                  }
                } catch {
                  toast.error("削除できませんでした");
                }
              });
            }}
          >
            {pending ? "削除中…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
