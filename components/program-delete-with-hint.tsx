"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";

const HIDE_DELAY_MS = 180;

export function ProgramDeleteWithHint({
  programId,
  action,
}: {
  programId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [hintVisible, setHintVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current !== null) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const showHint = useCallback(() => {
    clearHideTimer();
    setHintVisible(true);
  }, [clearHideTimer]);

  const scheduleHideHint = useCallback(() => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => {
      setHintVisible(false);
      hideTimer.current = null;
    }, HIDE_DELAY_MS);
  }, [clearHideTimer]);

  return (
    <div className="inline-flex flex-col items-end">
      <div onMouseEnter={showHint} onMouseLeave={scheduleHideHint}>
        <ConfirmDeleteForm
          action={action}
          title="このプログラムを削除しますか？"
          description="プログラムだけが削除され、中のプロジェクトやタスクは残ります（子がある場合は削除に失敗します）。"
          confirmLabel="削除する"
          triggerVariant="outline"
          triggerContent={<Trash2 className="text-destructive" />}
          triggerAriaLabel="削除を試みる"
        />
      </div>
      {hintVisible ? (
        <p
          className="text-muted-foreground mt-1 w-72 rounded-md border border-border bg-popover p-2 text-xs leading-relaxed shadow-sm"
          onMouseEnter={showHint}
          onMouseLeave={scheduleHideHint}
        >
          配下にプロジェクトが 1 件もないときだけ削除できます（子があれば先に
          <Link href={`/programs/${programId}`} className="text-primary underline underline-offset-2">
            プロジェクト側
          </Link>
          で空にしてください）。
        </p>
      ) : null}
    </div>
  );
}
