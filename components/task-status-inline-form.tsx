"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

export type TaskStatusOption = { value: string; label: string };

type Props = {
  action: (formData: FormData) => Promise<{ ok: boolean }>;
  defaultStatus: string;
  options: TaskStatusOption[];
  "aria-label"?: string;
  className?: string;
  selectId?: string;
};

export function TaskStatusInlineForm({
  action,
  defaultStatus,
  options,
  "aria-label": ariaLabel,
  className,
  selectId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [committed, setCommitted] = useState(defaultStatus);
  const [displayStatus, setOptimisticStatus] = useOptimistic(
    committed,
    (_current, next: string) => next,
  );

  return (
    <NativeSelect
      id={selectId}
      name="status"
      required
      value={displayStatus}
      disabled={isPending}
      aria-label={ariaLabel ?? "状態"}
      className={cn("h-9 min-w-36 text-sm", className)}
      onChange={(e) => {
        const next = e.target.value;
        setOptimisticStatus(next);
        startTransition(async () => {
          const fd = new FormData();
          fd.set("status", next);
          try {
            const r = await action(fd);
            if (!r.ok) {
              toast.error("状態を更新できませんでした");
              return;
            }
            setCommitted(next);
            router.refresh();
          } catch {
            toast.error("状態を更新できませんでした");
          }
        });
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </NativeSelect>
  );
}
