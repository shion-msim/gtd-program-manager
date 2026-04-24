"use client";

import { useRef } from "react";
import { NativeSelect } from "@/components/ui/native-select";

export type TaskStatusOption = { value: string; label: string };

type Props = {
  action: (formData: FormData) => void | Promise<void>;
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
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={action} className={className}>
      <NativeSelect
        id={selectId}
        name="status"
        required
        defaultValue={defaultStatus}
        aria-label={ariaLabel ?? "状態"}
        className="h-9 min-w-[9.5rem] text-sm"
        onChange={() => ref.current?.requestSubmit()}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
    </form>
  );
}
