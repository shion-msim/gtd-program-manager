"use client";

import type { ComponentProps, ReactNode } from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteProject } from "@/app/programs/[id]/actions";
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
  projectId: string;
  title?: string;
  description?: string;
  triggerLabel?: string;
  confirmLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
  triggerContent?: ReactNode;
  triggerAriaLabel?: string;
  onDeleted: () => void;
};

export function ProgramProjectDeleteConfirm({
  projectId,
  title = "このプロジェクトを削除しますか？",
  description = "配下のタスクもすべて削除されます。",
  triggerLabel = "削除",
  confirmLabel = "削除する",
  triggerVariant = "destructive",
  triggerContent,
  triggerAriaLabel,
  onDeleted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const triggerButton = (
    <Button
      type="button"
      variant={triggerVariant}
      size={triggerContent ? "icon-sm" : "sm"}
      aria-label={triggerContent ? (triggerAriaLabel ?? "削除") : undefined}
    >
      {triggerContent ?? triggerLabel}
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
                  const r = await deleteProject(projectId);
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
