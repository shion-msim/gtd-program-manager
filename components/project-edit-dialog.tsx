"use client";

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

export type ProjectEditFields = {
  id: string;
  name: string;
};

export function ProjectEditDialog({ project }: { project: ProjectEditFields }) {
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>プロジェクトを編集</DialogTitle>
          <DialogDescription>プロジェクト名を更新します。</DialogDescription>
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
