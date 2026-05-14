"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { moveProjectTask } from "@/app/projects/[id]/actions";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { ProjectMoveTarget } from "@/lib/project-move-targets";

type Props = {
  taskId: string;
  fromProjectId: string;
  moveTargets: ProjectMoveTarget[];
};

export function ProjectTaskMoveRow({ taskId, fromProjectId, moveTargets }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (moveTargets.length === 0) {
    return null;
  }

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            const r = await moveProjectTask(taskId, fromProjectId, fd);
            if (!r.ok) {
              toast.error("移動できませんでした");
              return;
            }
            toast.success("移動しました");
            router.refresh();
          } catch {
            toast.error("移動できませんでした");
          }
        });
      }}
    >
      <div className="token-move-target-min flex-1">
        <label htmlFor={`pt-move-${taskId}`} className="sr-only">
          移動先
        </label>
        <NativeSelect
          id={`pt-move-${taskId}`}
          name="targetProjectId"
          required
          disabled={pending}
          data-testid="project-move-target"
          defaultValue=""
        >
          <option value="">移動先を選択…</option>
          {moveTargets.map((m) => (
            <option key={m.projectId} value={m.projectId}>
              {m.programName} / {m.projectName}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" size="sm" data-testid="project-move-submit" disabled={pending}>
        {pending ? "移動中…" : "移動"}
      </Button>
    </form>
  );
}
