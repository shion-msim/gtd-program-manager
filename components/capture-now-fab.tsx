"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

import { InboxQuickAdd } from "@/components/inbox-quick-add";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** `useSearchParams` あり — 親で Suspense が必要です。 */
export function CaptureNowFabHost() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navKey = `${pathname}?${searchParams.toString()}`;

  return <CaptureNowFabInner key={navKey} />;
}

function CaptureNowFabInner() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div
        className="token-fab-anchor"
        data-slot="capture-now-fab-host"
      >
        <Button
          type="button"
          size="icon-lg"
          className="h-14 w-14 shrink-0 rounded-full shadow-lg"
          aria-label="いま拾う"
          data-testid="capture-now-fab"
          onClick={() => setOpen(true)}
        >
          <PlusIcon className="size-7" strokeWidth={2} aria-hidden />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md gap-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>いま拾う</DialogTitle>
            <DialogDescription>
              頭の中を空にするための一行キャプチャです。
            </DialogDescription>
          </DialogHeader>
          <InboxQuickAdd onAdded={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
