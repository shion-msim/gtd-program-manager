"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProgram } from "@/app/programs/actions";
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

function formatDateForInput(v: string | null | undefined): string {
  if (!v) {
    return "";
  }
  return v.slice(0, 10);
}

export type ProgramEditFields = {
  id: string;
  name: string;
  startOn: string | null;
  endOn: string | null;
};

export function ProgramEditDialog({ program }: { program: ProgramEditFields }) {
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
          <DialogTitle>プログラムを編集</DialogTitle>
          <DialogDescription>名前と期間を更新します。</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const r = await updateProgram(program.id, fd);
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
            <Label htmlFor={`dlg-program-name-${program.id}`}>名前</Label>
            <Input
              id={`dlg-program-name-${program.id}`}
              name="name"
              type="text"
              required
              defaultValue={program.name}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[10rem] flex-1 space-y-2">
              <Label htmlFor={`dlg-program-start-${program.id}`}>開始日</Label>
              <Input
                id={`dlg-program-start-${program.id}`}
                name="startOn"
                type="date"
                defaultValue={formatDateForInput(program.startOn ?? undefined)}
              />
            </div>
            <div className="min-w-[10rem] flex-1 space-y-2">
              <Label htmlFor={`dlg-program-end-${program.id}`}>終了日</Label>
              <Input
                id={`dlg-program-end-${program.id}`}
                name="endOn"
                type="date"
                defaultValue={formatDateForInput(program.endOn ?? undefined)}
              />
            </div>
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
