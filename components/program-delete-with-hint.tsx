"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  deleteProgram,
  disabled = false,
  disabledHint,
}: {
  programId: string;
  deleteProgram: (programId: string) => Promise<{ ok: boolean }>;
  /** 受信箱プログラム用: ボタン表示のみ・操作不可 */
  disabled?: boolean;
  /** disabled 時、ゴミ箱ホバーで表示する説明 */
  disabledHint?: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
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

  const triggerButton = (
    <Button type="button" variant="outline" size="icon-sm" aria-label="削除を試みる">
      <Trash2 className="text-destructive" />
    </Button>
  );

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
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger render={triggerButton} />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>このプログラムを削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  プログラムだけが削除され、中のプロジェクトやタスクは残ります（子がある場合は削除に失敗します）。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel type="button">キャンセル</AlertDialogCancel>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      try {
                        const r = await deleteProgram(programId);
                        if (r.ok) {
                          toast.success("削除しました");
                          setOpen(false);
                          router.refresh();
                        } else {
                          toast.error("削除できませんでした");
                        }
                      } catch {
                        toast.error("削除できませんでした");
                      }
                    });
                  }}
                >
                  {pending ? "削除中…" : "削除する"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {floatingHint}
    </>
  );
}
