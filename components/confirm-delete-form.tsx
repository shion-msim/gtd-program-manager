"use client";

import type { ComponentProps, ReactNode } from "react";
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
  /** アイコンなど。指定時は `triggerLabel` より優先され、`size` は icon 系に固定されます。 */
  triggerContent?: ReactNode;
  triggerAriaLabel?: string;
  confirmLabel?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
};

export function ConfirmDeleteForm({
  action,
  title,
  description = "この操作は元に戻せません。",
  triggerLabel = "削除",
  triggerContent,
  triggerAriaLabel,
  confirmLabel = "削除する",
  triggerVariant = "outline",
}: Props) {
  const triggerButton = (
    <Button
      type="button"
      variant={triggerVariant}
      size={triggerContent ? "icon-sm" : "sm"}
      aria-label={
        triggerContent ? (triggerAriaLabel ?? (typeof triggerLabel === "string" ? triggerLabel : "削除")) : undefined
      }
    >
      {triggerContent ?? triggerLabel}
    </Button>
  );
  return (
    <AlertDialog>
      <AlertDialogTrigger render={triggerButton} />
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
