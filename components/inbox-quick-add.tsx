"use client";

import { CornerDownLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { addInboxTask } from "@/app/inbox/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  /** Called after a successful add (e.g. close capture dialog). */
  onAdded?: () => void;
};

export function InboxQuickAdd({ onAdded }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      className="space-y-2"
      data-testid="inbox-quick-add"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            const r = await addInboxTask(fd);
            if (!r.ok) {
              toast.error("追加できませんでした");
              return;
            }
            toast.success("追加しました");
            formRef.current?.reset();
            onAdded?.();
            router.refresh();
          } catch {
            toast.error("追加できませんでした");
          }
        });
      }}
    >
      <div className="flex items-stretch gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="inbox-quick-title" className="sr-only">
            タスク
          </label>
          <Input
            id="inbox-quick-title"
            name="title"
            type="text"
            autoComplete="off"
            required
            disabled={pending}
            placeholder="1 行でタスクを追加"
            className="h-12 min-h-12 rounded-xl px-4 text-base shadow-sm md:text-lg"
          />
        </div>
        <Button
          type="submit"
          size="icon-lg"
          className="h-12 w-12 shrink-0 rounded-xl"
          aria-label="追加（Enter）"
          disabled={pending}
        >
          <CornerDownLeft className="size-5" strokeWidth={2.25} aria-hidden />
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">Enter キーでもすぐ追加できます。</p>
    </form>
  );
}
