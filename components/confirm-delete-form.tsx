"use client";

import type { ComponentProps } from "react";
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
  action: (formData: FormData) => Promise<void>;
  title: string;
  description?: string;
  triggerLabel?: string;
  confirmLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
};

export function ConfirmDeleteForm({
  action,
  title,
  description = "この操作は元に戻せません。",
  triggerLabel = "削除",
  confirmLabel = "削除する",
  triggerVariant = "outline",
}: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button type="button" variant={triggerVariant} size="sm">
            {triggerLabel}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">キャンセル</AlertDialogCancel>
          <form action={action}>
            <Button type="submit" variant="destructive" size="sm">
              {confirmLabel}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
