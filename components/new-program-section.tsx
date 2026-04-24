"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createProgram } from "@/app/programs/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewProgramSection() {
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [pending, startTransition] = useTransition();

  function openCreateDialog() {
    const v = nameInputRef.current?.value.trim() ?? "";
    if (!v) {
      return;
    }
    setDraftName(v);
    setDialogOpen(true);
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="new-program-name">名前</Label>
        <Input
          ref={nameInputRef}
          id="new-program-name"
          type="text"
          placeholder="例: 2026 Q2 イニシアチブ（入力後 Enter）"
          onKeyDown={(e) => {
            if (e.key !== "Enter") {
              return;
            }
            e.preventDefault();
            openCreateDialog();
          }}
        />
        <p className="text-muted-foreground text-xs">
          名前を入力して Enter を押すと編集ダイアログが開き、開始日・終了日を指定してから作成できます。
        </p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新規プログラム</DialogTitle>
            <DialogDescription>名前と期間を指定して作成します。</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const r = await createProgram(fd);
                if (r.ok) {
                  toast.success("プログラムを作成しました");
                  setDialogOpen(false);
                  if (nameInputRef.current) {
                    nameInputRef.current.value = "";
                  }
                  router.refresh();
                } else {
                  toast.error("作成できませんでした");
                }
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="new-program-dialog-name">名前</Label>
              <Input
                id="new-program-dialog-name"
                name="name"
                type="text"
                required
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="min-w-[10rem] flex-1 space-y-2">
                <Label htmlFor="new-program-dialog-start">開始日</Label>
                <Input id="new-program-dialog-start" name="startOn" type="date" />
              </div>
              <div className="min-w-[10rem] flex-1 space-y-2">
                <Label htmlFor="new-program-dialog-end">終了日</Label>
                <Input id="new-program-dialog-end" name="endOn" type="date" />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <DialogClose render={<Button type="button" variant="outline" size="sm" />}>
                キャンセル
              </DialogClose>
              <Button type="submit" size="sm" variant="secondary" disabled={pending}>
                {pending ? "作成中…" : "作成"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
