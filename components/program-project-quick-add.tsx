"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { createProject } from "@/app/programs/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = { programId: string };

export function ProgramProjectQuickAdd({ programId }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            const r = await createProject(programId, fd);
            if (!r.ok) {
              toast.error("追加できませんでした");
              return;
            }
            toast.success("プロジェクトを追加しました");
            formRef.current?.reset();
            router.refresh();
          } catch {
            toast.error("追加できませんでした");
          }
        });
      }}
    >
      <div className="min-w-0 flex-1">
        <Label htmlFor="new-project-name" className="sr-only">
          プロジェクト名
        </Label>
        <Input
          id="new-project-name"
          name="name"
          type="text"
          required
          disabled={pending}
          placeholder="プロジェクト名"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "追加中…" : "追加"}
      </Button>
    </form>
  );
}
