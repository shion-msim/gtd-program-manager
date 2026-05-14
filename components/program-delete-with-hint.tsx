"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { Button } from "@/components/ui/button";

const HIDE_DELAY_MS = 180;
const HINT_WIDTH_PX = 288;

function clampHintLeft(left: number) {
  if (typeof window === "undefined") {
    return left;
  }
  const margin = 8;
  return Math.max(margin, Math.min(left, window.innerWidth - HINT_WIDTH_PX - margin));
}

export function ProgramDeleteWithHint({
  programId,
  action,
  disabled = false,
  disabledHint,
}: {
  programId: string;
  action: (formData: FormData) => Promise<void>;
  /** 受信箱プログラム用: ボタン表示のみ・操作不可 */
  disabled?: boolean;
  /** disabled 時、ゴミ箱ホバーで表示する説明 */
  disabledHint?: ReactNode;
}) {
  const [hintVisible, setHintVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [hintPos, setHintPos] = useState<{ top: number; left: number } | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current !== null) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const updateHintPos = useCallback(() => {
    const el = anchorRef.current;
    if (!el) {
      return;
    }
    const r = el.getBoundingClientRect();
    setHintPos({
      top: r.bottom + 4,
      left: clampHintLeft(r.right - HINT_WIDTH_PX),
    });
  }, []);

  const showHint = useCallback(() => {
    clearHideTimer();
    updateHintPos();
    setHintVisible(true);
  }, [clearHideTimer, updateHintPos]);

  const scheduleHideHint = useCallback(() => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => {
      setHintVisible(false);
      hideTimer.current = null;
    }, HIDE_DELAY_MS);
  }, [clearHideTimer]);

  useEffect(() => {
    if (!hintVisible) {
      return;
    }
    const onScrollOrResize = () => updateHintPos();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [hintVisible, updateHintPos]);

  const floatingHint =
    hintVisible && hintPos && typeof document !== "undefined"
      ? createPortal(
          <div
            className="token-z-tooltip text-muted-foreground pointer-events-auto w-72 rounded-md border border-border bg-popover p-2 text-xs leading-relaxed shadow-sm"
            style={{
              position: "fixed",
              top: hintPos.top,
              left: hintPos.left,
            }}
            onMouseEnter={showHint}
            onMouseLeave={scheduleHideHint}
          >
            {disabled ? (
              disabledHint
            ) : (
              <p>
                配下にプロジェクトが 1 件もないときだけ削除できます（子があれば先に
                <Link
                  href={`/programs/${programId}`}
                  className="text-primary underline underline-offset-2"
                >
                  プロジェクト側
                </Link>
                で空にしてください）。
              </p>
            )}
          </div>,
          document.body,
        )
      : null;

  if (disabled) {
    return (
      <>
        <div
          ref={anchorRef}
          className="inline-flex"
          onMouseEnter={disabledHint ? showHint : undefined}
          onMouseLeave={disabledHint ? scheduleHideHint : undefined}
        >
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled
            aria-label="削除できません"
          >
            <Trash2 className="text-muted-foreground" />
          </Button>
        </div>
        {disabledHint ? floatingHint : null}
      </>
    );
  }

  return (
    <>
      <div ref={anchorRef} className="inline-flex">
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
      </div>
      {floatingHint}
    </>
  );
}
