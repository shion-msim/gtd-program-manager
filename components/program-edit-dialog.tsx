"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { NativeSelect } from "@/components/ui/native-select";
import { ACCENT_TOKENS, resolveAccentToken } from "@/lib/design-tokens";

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
  accentColor: string | null;
};

export function ProgramEditDialog({
  program,
  disabled = false,
}: {
  program: ProgramEditFields;
  /** 受信箱プログラムなど編集不可のとき true */
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (disabled) {
    return (
      <Button type="button" variant="secondary" size="icon-sm" aria-label="編集" disabled>
        <Pencil />
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label="編集"
            title="編集"
          >
            <Pencil />
          </Button>
        }
      />
      <DialogContent className="token-dialog-content-layout">
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
                router.refresh();
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
          <div className="space-y-2">
            <Label htmlFor={`dlg-program-accent-${program.id}`}>カード左端の色</Label>
            <div className="flex flex-wrap items-center gap-3">
              <NativeSelect
                id={`dlg-program-accent-${program.id}`}
                name="accentColor"
                defaultValue={resolveAccentToken(program.accentColor) ?? "slate"}
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
          <div className="token-form-row">
            <div className="token-form-field-col">
              <Label htmlFor={`dlg-program-start-${program.id}`}>開始日</Label>
              <Input
                id={`dlg-program-start-${program.id}`}
                name="startOn"
                type="date"
                defaultValue={formatDateForInput(program.startOn ?? undefined)}
              />
            </div>
            <div className="token-form-field-col">
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
