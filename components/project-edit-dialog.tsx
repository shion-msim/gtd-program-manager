"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProject } from "@/app/programs/[id]/actions";
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
import { ACCENT_TOKENS, resolveAccentToken } from "@/lib/design-tokens";

export type ProjectEditFields = {
  id: string;
  name: string;
  accentColor: string | null;
  isArchived: boolean;
};

export function ProjectEditDialog({ project }: { project: ProjectEditFields }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="secondary" size="sm">
            編集
          </Button>
        }
      />
      <DialogContent className="token-dialog-content-layout">
        <DialogHeader>
          <DialogTitle>プロジェクトを編集</DialogTitle>
          <DialogDescription>名前・色・アーカイブ状態を更新します。</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const r = await updateProject(project.id, fd);
              if (r.ok) {
                toast.success("保存しました");
                router.refresh();
                setOpen(false);
              } else {
                toast.error("保存できませんでした");
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={`dlg-project-name-${project.id}`}>名前</Label>
            <Input
              id={`dlg-project-name-${project.id}`}
              name="name"
              type="text"
              required
              defaultValue={project.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`dlg-project-accent-${project.id}`}>カード左端の色</Label>
            <div className="flex flex-wrap items-center gap-3">
              <NativeSelect
                id={`dlg-project-accent-${project.id}`}
                name="accentColor"
                defaultValue={resolveAccentToken(project.accentColor) ?? "slate"}
                className="token-form-select-min"
                aria-label="アクセント色"
              >
                {ACCENT_TOKENS.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </NativeSelect>
              <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" name="clearAccent" className="size-4 rounded border" />
                色を使わない
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isArchived"
                defaultChecked={project.isArchived}
                className="size-4 rounded border"
              />
              アーカイブする（サイドバーと並べ替え対象から外します。タスクは残ります）
            </label>
          </div>
          <DialogFooter className="pt-2">
            <DialogClose render={<Button type="button" variant="outline" size="sm" />}>
              キャンセル
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
