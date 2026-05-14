"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { addProjectTask } from "@/app/projects/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { projectId: string };

export function ProjectTaskQuickAdd({ projectId }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      className="flex flex-wrap items-end gap-2"
      data-testid="project-task-quick-add"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            const r = await addProjectTask(projectId, fd);
            if (!r.ok) {
              toast.error("追加できませんでした");
              return;
            }
            toast.success("追加しました");
            formRef.current?.reset();
            router.refresh();
          } catch {
            toast.error("追加できませんでした");
          }
        });
      }}
    >
      <div className="min-w-0 flex-1">
        <label htmlFor="new-task-title" className="sr-only">
          タイトル
        </label>
        <Input
          id="new-task-title"
          name="title"
          type="text"
          required
          disabled={pending}
          placeholder="次の行動として追加"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "追加中…" : "追加"}
      </Button>
    </form>
  );
}
