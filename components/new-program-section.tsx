"use client";

import { CornerDownLeft } from "lucide-react";
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
import { NativeSelect } from "@/components/ui/native-select";
import { ACCENT_TOKENS } from "@/lib/design-tokens";

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
      <div className="flex flex-wrap items-center gap-2">
        <Input
          ref={nameInputRef}
          id="new-program-name"
          type="text"
          className="min-w-0 flex-1"
          placeholder="名前を入力"
          aria-label="新規プログラム名"
          onKeyDown={(e) => {
            if (e.key !== "Enter") {
              return;
            }
            e.preventDefault();
            openCreateDialog();
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          className="shrink-0"
          aria-label="確定（Enter と同じ）"
          title="確定（Enter と同じ）"
          onClick={() => openCreateDialog()}
        >
          <CornerDownLeft className="size-4" aria-hidden />
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="token-dialog-content-layout">
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
            <div className="token-form-row">
              <div className="token-form-field-col">
                <Label htmlFor="new-program-dialog-start">開始日</Label>
                <Input id="new-program-dialog-start" name="startOn" type="date" />
              </div>
              <div className="token-form-field-col">
                <Label htmlFor="new-program-dialog-end">終了日</Label>
                <Input id="new-program-dialog-end" name="endOn" type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-program-dialog-accent">カード左端の色（任意）</Label>
              <div className="flex flex-wrap items-center gap-3">
                <NativeSelect
                  id="new-program-dialog-accent"
                  name="accentColor"
                  defaultValue="slate"
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
